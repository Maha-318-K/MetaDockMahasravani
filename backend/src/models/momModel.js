const mongoose = require('mongoose');

const momSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  date: { type: String, default: '' },
  time: { type: String, default: '' },
  agendaTitle: { type: String, default: '' },
  agendaSubtitle: { type: String, default: 'Meeting' },
  pointsCount: { type: Number, default: 0 },
  preparedBy: {
    name: { type: String, default: 'User' },
    empId: { type: String, default: '' },
    avatar: { type: String, default: '' }
  },
  attendees: { type: Number, default: 0 },
  attendeesList: { type: [String], default: [] },
  notes: { type: String, default: '' }
}, {
  timestamps: true,
  collection: 'mom'
});

module.exports = mongoose.model('MOM', momSchema);
