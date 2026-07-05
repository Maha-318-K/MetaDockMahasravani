const mongoose = require('mongoose');

const actionLogSchema = new mongoose.Schema({
  who: {
    type: String,
    required: true,
    default: 'System'
  },
  what: {
    type: String,
    required: true
  },
  why: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ActionLog = mongoose.model('ActionLog', actionLogSchema);
module.exports = ActionLog;
