const mongoose = require('mongoose');

const trackerSchema = new mongoose.Schema({
  trackerData: { type: mongoose.Schema.Types.Mixed, default: {} },
  customColumns: {
    col1: { type: String, default: 'Page Name' },
    col2: { type: String, default: 'Issue / Point' },
    col3: { type: String, default: 'Status' },
    col4: { type: String, default: 'Assignee' },
    col5: { type: String, default: 'Staging Deployment' },
    col6: { type: String, default: 'Production Deployment' }
  },
  customStatuses: { type: Array, default: [
    { name: 'Completed', color: '#22c55e' },
    { name: 'In Progress', color: '#3b82f6' },
    { name: 'Pending', color: '#eab308' },
    { name: 'Open', color: '#f8ab37' }
  ]}
}, {
  timestamps: true,
  collection: 'tracker'
});

module.exports = mongoose.model('Tracker', trackerSchema);
