const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: String,
  by: String,
  date: String
}, { _id: false });

const whatsappConfigSchema = new mongoose.Schema({
  monitoredGroups: { type: [String], default: [] },
  lastSyncTime: { type: String, default: null },
  lastProcessedMessageTime: { type: String, default: null },
  processedMessageIds: { type: [String], default: [] },
  issueDefaultGroup: { type: String, default: null },
  connectedDeviceId: { type: String, default: null },
  lastMessageSent: { type: String, default: null },
  messagesSentCount: { type: Number, default: 0 },
  auditLogs: { type: [auditLogSchema], default: [] }
}, {
  timestamps: true,
  collection: 'whatsappConfig'
});

module.exports = mongoose.model('WhatsappConfig', whatsappConfigSchema);
