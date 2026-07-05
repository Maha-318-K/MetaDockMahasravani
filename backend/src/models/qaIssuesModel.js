const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  action: String,
  by: String,
  date: String
}, { _id: false });

const commentSchema = new mongoose.Schema({
  id: String,
  text: String,
  author: String,
  date: String
}, { _id: false });

const qaIssueSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  issueId: { type: String, required: true },
  project: { type: String, default: '' },
  module: { type: String, default: '' },
  pageName: { type: String, default: '' },
  issueTitle: { type: String, default: '' },
  type: { type: String, default: 'Functional' },
  severity: { type: String, default: 'Medium' },
  priority: { type: String, default: 'P3' },
  status: { type: String, default: 'Open' },
  assignedTo: { type: String, default: '' },
  raisedBy: { type: String, default: '' },
  raisedDate: { type: String, default: '' },
  attachmentsCount: { type: Number, default: 0 },
  issueDetails: { type: String, default: '' },
  attachments: { type: [String], default: [] },
  comments: { type: [commentSchema], default: [] },
  history: { type: [historySchema], default: [] },
  resolvedDate: { type: String, default: '' }
}, {
  timestamps: true,
  collection: 'qaIssues'
});

module.exports = mongoose.model('QAIssue', qaIssueSchema);
