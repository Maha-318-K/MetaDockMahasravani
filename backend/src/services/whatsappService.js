const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const issuesModel = require('../models/issuesModel');
const aiExtractionService = require('./aiExtractionService');
const ocrService = require('./ocrService');
const configModel = require('../models/whatsappConfigModel');

const logToFile = (message) => {
  try {
    const logPath = path.join(process.cwd(), 'whatsapp-debug.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
  } catch (e) {}
};

let client;
let currentQrCode = null;
let connectionStatus = 'Disconnected';
let monitoredGroups = []; // Array of group IDs to monitor
const serverStartTime = Math.floor(Date.now() / 1000);
let healthMonitorInterval = null;

const getConfigDoc = async () => {
  let doc = await configModel.findOne();
  if (!doc) {
    doc = new configModel();
    await doc.save();
  }
  return doc;
};

const addAuditLog = async (action, user = 'System') => {
  try {
    const doc = await getConfigDoc();
    const logs = doc.auditLogs || [];
    logs.push({ date: new Date().toISOString(), action, user });
    doc.auditLogs = logs;
    await doc.save();
  } catch (err) {}
};

const initializeWhatsApp = async () => {
  const config = await getConfigDoc();
  monitoredGroups = config.monitoredGroups || [];
  
  // Handle pending disconnect
  if (config.pendingDisconnect) {
    console.log('Cleaning up disconnected session...');
    const sessionPath = path.join(process.cwd(), 'whatsapp-session');
    if (fs.existsSync(sessionPath)) {
      try {
        fs.rmSync(sessionPath, { recursive: true, force: true });
      } catch (e) {
        console.error('Failed to clear session on boot', e);
      }
    }
    config.pendingDisconnect = false;
    config.processedMessageIds = [];
    config.monitoredGroups = [];
    config.connectedDeviceId = null;
    config.issueDefaultGroup = null;
    await config.save();
    monitoredGroups = [];
  }

  if (client) {
    try {
      client.destroy();
    } catch (e) {}
  }

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './whatsapp-session' }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    }
  });

  client.on('qr', (qr) => {
    console.log('QR Code generated');
    currentQrCode = qr;
    connectionStatus = 'Disconnected';
  });

  client.on('ready', async () => {
    console.log('WhatsApp Client is ready!');
    connectionStatus = 'Connected';
    currentQrCode = null;
    
    const doc = await getConfigDoc();
    if (!doc.connectedDeviceId) {
      const newDeviceId = `device_${Date.now()}`;
      doc.connectedDeviceId = newDeviceId;
      await doc.save();
      await addAuditLog(`WhatsApp Connected. New Device ID: ${newDeviceId}`);
    }
    
    // Health monitor
    if (healthMonitorInterval) clearInterval(healthMonitorInterval);
    healthMonitorInterval = setInterval(async () => {
      try {
        const state = await client.getState();
        if (state === 'CONNECTED') {
          const doc = await getConfigDoc();
          doc.lastSyncTime = new Date().toISOString();
          await doc.save();
        }
      } catch (err) {
        console.error('Health monitor error:', err);
      }
    }, 60000); // Check every minute
  });

  client.on('disconnected', async (reason) => {
    console.log('WhatsApp Client was disconnected', reason);
    connectionStatus = 'Disconnected';
    if (healthMonitorInterval) clearInterval(healthMonitorInterval);
    try {
      await client.destroy();
    } catch (e) {}
    
    // Auto reconnect by completely reinitializing the client
    setTimeout(() => {
      connectionStatus = 'Reconnecting';
      initializeWhatsApp();
    }, 5000);
  });

  client.on('message_create', async (message) => {
    const logMsg = `Received message from ${message.from}. Body: "${message.body}". Timestamp: ${message.timestamp}`;
    console.log(`[WhatsApp] ${logMsg}`);
    logToFile(logMsg);
    
    // Ignore messages that were sent by the bot itself (to prevent infinite loops)
    if (message.body && (message.body.includes('🐛 *Defect Logged*') || message.body.includes('🚨 *New QA Issue*'))) {
      return;
    }
    
    // Only process if it's from a monitored group
    const chat = await message.getChat();
    
    if (!chat.isGroup || !monitoredGroups.includes(chat.id._serialized)) {
      return;
    }

    const doc = await getConfigDoc();
    if (doc.processedMessageIds && doc.processedMessageIds.includes(message.id._serialized)) {
      return; // Prevent duplicates
    }

    try {
      await processMessage(message, chat, doc);
    } catch (error) {
      const errMsg = `Error processing WhatsApp message: ${error.message}\nStack: ${error.stack}`;
      console.error(errMsg);
      logToFile(errMsg);
    }
  });

  client.initialize().catch(err => {
    console.error('Error initializing WhatsApp client:', err);
    setTimeout(() => {
      initializeWhatsApp();
    }, 5000);
  });
};

const processMessage = async (message, chat, configDoc) => {
  const senderContact = await message.getContact();
  const senderName = senderContact.pushname || senderContact.name || senderContact.number;
  
  let messageText = message.body || '';
  let attachments = [];
  let ocrText = '';

  // Handle Media
  if (message.hasMedia) {
    const media = await message.downloadMedia();
    if (media) {
      const extension = media.mimetype.split('/')[1].split(';')[0];
      const filename = `wa_${Date.now()}.${extension}`;
      
      let folder = 'documents';
      let type = 'document';

      if (media.mimetype.startsWith('image/')) {
        folder = 'images';
        type = 'image';
      } else if (media.mimetype.startsWith('video/')) {
        folder = 'videos';
        type = 'video';
      }

      const savePath = path.join(__dirname, `../../uploads/production-issues/${folder}`, filename);
      fs.writeFileSync(savePath, media.data, 'base64');
      
      attachments.push({ type, name: filename, url: `/uploads/production-issues/${folder}/${filename}` });

      // If it's an image, run OCR
      if (type === 'image') {
        const text = await ocrService.extractTextFromImage(savePath);
        if (text) {
          ocrText = `\n[OCR Text from Image]: ${text}`;
        }
      }
    }
  }

  try {
    const fullTextToAnalyze = `${messageText} ${ocrText}`.trim();
    if (!fullTextToAnalyze && attachments.length === 0) return;

    // AI Extraction
    const extracted = aiExtractionService.extractIssueDetails(messageText || 'Media upload without text', ocrText);

    // Duplicate Detection
    const openIssues = await issuesModel.find({ status: { $nin: ['Closed', 'Resolved'] } });
    
    // Simple heuristic: if the pageName matches and title is very similar (or same keywords)
    const existingIssue = openIssues.find(i => 
      i.pageName === extracted.pageName && 
      (i.issue.toLowerCase().includes(extracted.title.toLowerCase()) || 
       extracted.title.toLowerCase().includes(i.issue.toLowerCase().substring(0, 20)))
    );

    if (existingIssue) {
      existingIssue.attachments = [...(existingIssue.attachments || []), ...attachments];
      existingIssue.duplicateCount = (existingIssue.duplicateCount || 0) + 1;
      existingIssue.history = existingIssue.history || [];
      existingIssue.history.push({
        date: new Date().toLocaleString('en-GB'),
        action: `Duplicate issue detected from WhatsApp. Message from ${senderName}.`,
        user: 'System'
      });
      await existingIssue.save();
      const msg = `Duplicate detected for issue ${existingIssue.id}`;
      console.log(msg);
      logToFile(msg);
    } else {
      // Create new issue
      const latest = await issuesModel.findOne({ id: /^PI-/ }).sort({ id: -1 });
      let newIdNum = 1;
      if (latest && latest.id) {
        newIdNum = parseInt(latest.id.replace('PI-', ''), 10) + 1;
      }
      const formattedId = `PI-${String(newIdNum).padStart(4, '0')}`;

      const newIssue = new issuesModel({
        id: formattedId,
        pageName: extracted.pageName,
        issue: `${extracted.title}\n\n${extracted.description}`,
        priority: extracted.priority,
        raisedBy: senderName,
        raisedSrc: 'via WhatsApp',
        attachments: attachments,
        status: 'Open',
        history: [{
          date: new Date().toLocaleString('en-GB'),
          action: `Issue created via WhatsApp message from ${senderName}.`,
          user: 'System'
        }]
      });
      await newIssue.save();
      
      const msg = `New WhatsApp issue created: ${newIssue.id}`;
      console.log(msg);
      logToFile(msg);
    }

    // Update persistent config
    const newProcessedIds = [...(configDoc.processedMessageIds || []), message.id._serialized];
    if (newProcessedIds.length > 1000) newProcessedIds.splice(0, newProcessedIds.length - 1000);
    configDoc.lastProcessedMessageTime = new Date().toISOString();
    configDoc.processedMessageIds = newProcessedIds;
    await configDoc.save();
  } catch (err) {
    const errMsg = `Error in processing message details: ${err.message}\nStack: ${err.stack}`;
    console.error(errMsg);
    logToFile(errMsg);
  }
};

const getStatus = async () => {
  const doc = await getConfigDoc();
  return {
    status: connectionStatus,
    qrCode: currentQrCode,
    monitoredGroups,
    lastSyncTime: doc.lastSyncTime,
    lastProcessedMessageTime: doc.lastProcessedMessageTime,
    issueDefaultGroup: doc.issueDefaultGroup,
    connectedDeviceId: doc.connectedDeviceId,
    lastMessageSent: doc.lastMessageSent,
    messagesSentCount: doc.messagesSentCount,
    auditLogs: doc.auditLogs || []
  };
};

const setGroups = async (groups) => {
  monitoredGroups = groups;
  const doc = await getConfigDoc();
  doc.monitoredGroups = groups;
  await doc.save();
};

const setIssueDefaultGroup = async (groupId) => {
  const doc = await getConfigDoc();
  doc.issueDefaultGroup = groupId;
  await doc.save();
  await addAuditLog(`Issue Default Group configured to: ${groupId || 'None'}`);
};

const sendIssueToGroup = async (payload, user) => {
  const doc = await getConfigDoc();
  if (!doc.issueDefaultGroup) throw new Error("No default issue group selected.");
  if (connectionStatus !== 'Connected' || !client) throw new Error("WhatsApp is not connected.");
  
  let { pageName, issueDetails, attachments, priority, module } = payload;

  if (!pageName || pageName === 'General' || pageName === 'Unknown Page') {
    if (attachments && attachments.length > 0 && attachments[0].url && attachments[0].url.startsWith('/uploads/')) {
       const filePath = path.join(process.cwd(), attachments[0].url);
       if (fs.existsSync(filePath) && attachments[0].type === 'image') {
          try {
            const text = await ocrService.extractTextFromImage(filePath);
            if (text) {
               const extracted = aiExtractionService.extractIssueDetails(`${issueDetails}\n\n[OCR]: ${text}`);
               if (extracted && extracted.pageName && extracted.pageName !== 'General') {
                  pageName = extracted.pageName;
                  module = extracted.module || module;
               }
            }
          } catch(e) { console.error("OCR Extraction failed during WA send", e); }
       }
    }
  }

  const caption = `🐛 *Defect Logged*\n*Priority:* ${priority || 'P3'} | *Module:* ${module || 'General'}\n*Page:* ${pageName || 'Unknown'}\n\n*Details:*\n${issueDetails || 'No details provided.'}`;
  
  try {
    if (attachments && attachments.length > 0) {
      let firstMediaSent = false;
      for (let i = 0; i < attachments.length; i++) {
        const att = attachments[i];
        if (att.url && att.url.startsWith('/uploads/')) {
          const filePath = path.join(process.cwd(), att.url);
          if (fs.existsSync(filePath)) {
            const media = MessageMedia.fromFilePath(filePath);
            if (!firstMediaSent) {
              await client.sendMessage(doc.issueDefaultGroup, media, { caption });
              firstMediaSent = true;
            } else {
              await client.sendMessage(doc.issueDefaultGroup, media);
            }
          }
        }
      }
      if (!firstMediaSent) {
         await client.sendMessage(doc.issueDefaultGroup, caption);
      }
    } else {
      await client.sendMessage(doc.issueDefaultGroup, caption);
    }
    
    doc.lastMessageSent = new Date().toISOString();
    doc.messagesSentCount = (doc.messagesSentCount || 0) + 1;
    await doc.save();
    
    await addAuditLog(`Issue created and sent to group ${doc.issueDefaultGroup}: ${pageName}`, user);
    return { success: true };
  } catch (err) {
    console.error("Error sending WhatsApp message:", err);
    throw new Error("Failed to send WhatsApp message");
  }
};

const sendDocumentMessage = async (payload, user) => {
  const doc = await getConfigDoc();
  if (connectionStatus !== 'Connected' || !client) throw new Error("WhatsApp is not connected.");
  
  const { chatId, documentName, documentType, generatedDate, attachmentUrl } = payload;
  if (!chatId) throw new Error("No destination chat provided.");
  
  const caption = `📄 *New Document Generated*\n\n*Name:* ${documentName || 'Untitled'}\n*Type:* ${documentType || 'Custom Report'}\n*Generated:* ${generatedDate || 'Recently'}\n\n_Please check the portal for details._`;
  
  try {
    if (attachmentUrl && attachmentUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), attachmentUrl);
      if (fs.existsSync(filePath)) {
        const media = MessageMedia.fromFilePath(filePath);
        await client.sendMessage(chatId, media, { caption });
      } else {
        await client.sendMessage(chatId, caption);
      }
    } else {
      await client.sendMessage(chatId, caption);
    }
    
    doc.lastMessageSent = new Date().toISOString();
    doc.messagesSentCount = (doc.messagesSentCount || 0) + 1;
    await doc.save();
    
    await addAuditLog(`Document '${documentName}' sent to chat ${chatId}`, user);
    return { success: true };
  } catch (err) {
    console.error("Error sending document message:", err);
    throw new Error("Failed to send WhatsApp message");
  }
};

// Async method to fetch all groups and contacts the bot is part of
const getAvailableChats = async () => {
  if (connectionStatus !== 'Connected') return [];
  const chats = await client.getChats();
  return chats.map(c => ({
    id: c.id._serialized,
    name: c.name || c.id.user || 'Unknown'
  }));
};

const disconnectWhatsApp = async () => {
  console.log('Disconnecting WhatsApp...');
  if (client) {
    try {
      await client.destroy();
      // Give Puppeteer an extra second to fully close chrome processes
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      console.error('Error destroying client:', e);
    }
  }
  
  connectionStatus = 'Disconnected';
  currentQrCode = null;
  
  await addAuditLog('WhatsApp Disconnected manually');
  
  // Clear cache and set pending disconnect flag so the next boot cleans up the folder securely
  const doc = await getConfigDoc();
  doc.pendingDisconnect = true;
  await doc.save();
  
  // Force a restart of the Node process to completely kill any zombie Puppeteer Chrome instances holding file locks.
  // Nodemon will automatically spin the server right back up, and `initializeWhatsApp` will delete the session folder securely on boot.
  setTimeout(() => {
    console.log('Restarting server to finalize WhatsApp disconnect...');
    process.exit(1);
  }, 1000);

  return { success: true };
};

module.exports = {
  initializeWhatsApp,
  getStatus,
  setGroups,
  setIssueDefaultGroup,
  sendIssueToGroup,
  sendDocumentMessage,
  getAvailableChats,
  disconnectWhatsApp
};
