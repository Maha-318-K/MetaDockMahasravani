const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema({
  requirementTriggerStatuses: { type: [String], default: ['Future Implementation'] },
  adminEmail: { type: String, default: 'admin@metadock.com' }
}, {
  timestamps: true,
  collection: 'appSettings'
});

module.exports = mongoose.model('AppSettings', appSettingsSchema);
