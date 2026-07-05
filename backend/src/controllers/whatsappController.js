const whatsappService = require('../services/whatsappService');
const issuesModel = require('../models/issuesModel');

exports.getStatus = (req, res) => {
  const status = whatsappService.getStatus();
  res.json(status);
};

exports.getChats = async (req, res) => {
  try {
    const chats = await whatsappService.getAvailableChats();
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
};

exports.setGroups = (req, res) => {
  const { groups } = req.body;
  if (!Array.isArray(groups)) {
    return res.status(400).json({ error: 'groups must be an array' });
  }
  whatsappService.setGroups(groups);
  res.json({ success: true, groups });
};

exports.setIssueGroup = (req, res) => {
  const { groupId } = req.body;
  whatsappService.setIssueDefaultGroup(groupId);
  res.json({ success: true, groupId });
};

exports.sendIssue = async (req, res) => {
  const { pageName, issueDetails, attachments, user } = req.body;
  try {
    const result = await whatsappService.sendIssueToGroup({ pageName, issueDetails, attachments }, user);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.sendDocument = async (req, res) => {
  const { chatId, documentName, documentType, generatedDate, attachmentUrl, user } = req.body;
  try {
    const result = await whatsappService.sendDocumentMessage({ chatId, documentName, documentType, generatedDate, attachmentUrl }, user);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getMetrics = async (req, res) => {
  try {
    const issues = await issuesModel.find();
    
    const today = new Date().toLocaleDateString('en-GB'); 
    
    const whatsappIssues = issues.filter(i => i.raisedSrc === 'via WhatsApp');
    
    const totalWhatsAppIssues = whatsappIssues.length;
    const todaysIssues = whatsappIssues.filter(i => String(i.raisedDate).startsWith(today)).length;
    const criticalIssues = whatsappIssues.filter(i => i.priority === 'Critical').length;
    const openIssues = whatsappIssues.filter(i => i.status === 'Open' || i.status === 'In Progress').length;
    const resolvedIssues = whatsappIssues.filter(i => i.status === 'Closed' || i.status === 'Resolved').length;
    const duplicateIssuesPrevented = whatsappIssues.reduce((sum, i) => sum + (i.duplicateCount || 0), 0);

    res.json({
      totalWhatsAppIssues,
      todaysIssues,
      criticalIssues,
      openIssues,
      resolvedIssues,
      duplicateIssuesPrevented
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.disconnect = async (req, res) => {
  try {
    await whatsappService.disconnectWhatsApp();
    res.json({ success: true, message: 'WhatsApp disconnected successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disconnect WhatsApp' });
  }
};
