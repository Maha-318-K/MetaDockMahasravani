const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, default: 'Active' },
  logo: { type: String, default: null }
}, {
  timestamps: true,
  collection: 'projects'
});

module.exports = mongoose.model('Project', projectSchema);
