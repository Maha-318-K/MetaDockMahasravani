const mongoose = require('mongoose');

const requirementHistorySchema = new mongoose.Schema({
  action: String,
  by: String,
  date: String
}, { _id: false });

const requirementSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, default: 'Untitled Requirement' },
  module: { type: String, default: 'General' },
  description: { type: String, default: '' },
  priority: { type: String, default: 'Medium' },
  status: { type: String, default: 'Under Review' },
  requestedBy: { type: String, default: 'System' },
  requestedDate: { type: String, default: '' },
  targetDate: { type: String, default: '-' },
  history: { type: [requirementHistorySchema], default: [] }
}, {
  timestamps: true,
  collection: 'requirements'
});

module.exports = mongoose.model('Requirement', requirementSchema);
