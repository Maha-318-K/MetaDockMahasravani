const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  project: { type: String, default: '' },
  module: { type: String, default: '' },
  pageName: { type: String, default: '' },
  totalTestCases: { type: Number, default: 0 },
  automatedCases: { type: Number, default: 0 },
  status: { type: String, default: 'Not Started' },
  lastUpdated: { type: String, default: '' }
}, {
  timestamps: true,
  collection: 'automations'
});

module.exports = mongoose.model('Automation', automationSchema);
