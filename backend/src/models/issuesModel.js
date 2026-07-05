const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  date: String,
  time: String,
  user: String,
  action: String,
  details: mongoose.Schema.Types.Mixed
}, { _id: false });

const issueSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  pageName: { type: String, default: '' },
  issue: { type: String, default: '' },
  status: { type: String, default: 'Open' },
  assignee: { type: String, default: '' },
  deployDate: { type: String, default: '-' },
  raisedDate: { type: String, default: '' },
  raisedSrc: { type: String, default: '' },
  attachments: { type: [String], default: [] },
  history: { type: [historySchema], default: [] },
  priority: { type: String, default: 'Medium' },
  duplicateCount: { type: Number, default: 0 },
  logs: { type: Array, default: [] },
  movedToRequirement: { type: Boolean, default: false }
}, {
  timestamps: true,
  collection: 'issues' // to match our migrated collection
});

module.exports = mongoose.model('Issue', issueSchema);
