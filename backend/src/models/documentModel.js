const mongoose = require('mongoose');

const documentHistorySchema = new mongoose.Schema({
  action: String,
  by: String,
  date: String
}, { _id: false });

const documentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  documentId: { type: String, required: true },
  documentName: { type: String, default: 'Untitled Document' },
  documentType: { type: String, default: 'Custom Report' },
  createdBy: { type: String, default: 'System' },
  createdDate: { type: String, default: '' },
  generatedDate: { type: String, default: '' },
  status: { type: String, default: 'Generated' },
  filters: { type: mongoose.Schema.Types.Mixed, default: {} },
  history: { type: [documentHistorySchema], default: [] }
}, {
  timestamps: true,
  collection: 'documents'
});

module.exports = mongoose.model('Document', documentSchema);
