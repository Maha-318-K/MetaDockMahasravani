const documentModel = require('../models/documentModel');
const requirementsModel = require('../models/requirementsModel');
const momModel = require('../models/momModel');
const qaIssuesModel = require('../models/qaIssuesModel');
const issuesModel = require('../models/issuesModel'); // Production issues

const getDocuments = (req, res) => {
  try {
    const data = documentModel.getAllDocuments();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDocument = async (req, res) => {
  try {
    const doc = await documentModel.findOne({ id: req.params.id });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDocumentData = async (req, res) => {
  try {
    const docRecord = await documentModel.findOne({ id: req.params.id });
    if (!docRecord) return res.status(404).json({ success: false, message: 'Document not found' });
    
    const filters = docRecord.filters || {};
    const reportData = {
      metadata: docRecord,
      requirements: [],
      mom: [],
      qaIssues: [],
      prodIssues: []
    };

    const parseDate = (dStr) => {
      if (!dStr || dStr === '-') return new Date(0);
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return new Date(0);
      return d;
    };

    const isWithinRange = (dateStr, from, to) => {
      const d = parseDate(dateStr);
      const f = from ? new Date(from) : new Date(0);
      const t = to ? new Date(to) : new Date(8640000000000000); 
      f.setHours(0,0,0,0);
      t.setHours(23,59,59,999);
      return d >= f && d <= t;
    };

    if (filters.requirements && filters.requirements.selected) {
      const allReqs = await requirementsModel.find();
      reportData.requirements = allReqs.filter(r => isWithinRange(r.requestedDate, filters.requirements.from, filters.requirements.to));
    }
    if (filters.mom && filters.mom.selected) {
      const allMoms = await momModel.find();
      reportData.mom = allMoms.filter(m => isWithinRange(m.date, filters.mom.from, filters.mom.to));
    }
    if (filters.qaIssues && filters.qaIssues.selected) {
      const allQA = await qaIssuesModel.find();
      reportData.qaIssues = allQA.filter(q => isWithinRange(q.raisedDate, filters.qaIssues.from, filters.qaIssues.to));
    }
    if (filters.prodIssues && filters.prodIssues.selected) {
      const allProd = await issuesModel.find();
      reportData.prodIssues = allProd.filter(p => isWithinRange(p.raisedDate, filters.prodIssues.from, filters.prodIssues.to));
    }

    res.status(200).json({ success: true, data: reportData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const generateDocument = async (req, res) => {
  try {
    const data = req.body;
    const baseId = 1000;
    const latest = await documentModel.findOne({ documentId: /^DOC-/ }).sort({ documentId: -1 });
    let maxExisting = baseId;
    if (latest && latest.documentId) {
      maxExisting = parseInt(latest.documentId.replace('DOC-', ''), 10);
    }
    const newId = `DOC-${String(maxExisting + 1).padStart(4, '0')}`;

    const newDoc = new documentModel({
      id: Date.now().toString(),
      documentId: newId,
      documentName: data.documentName || 'Untitled Document',
      documentType: data.documentType || 'Custom Report',
      createdBy: data.createdBy || 'System',
      createdDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      generatedDate: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'Generated',
      filters: data.filters || {},
      history: [{ action: 'Document Created', by: data.createdBy || 'System', date: new Date().toISOString() }]
    });

    await newDoc.save();
    res.status(201).json({ success: true, data: newDoc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateDocument = async (req, res) => {
  try {
    const updateData = { ...req.body };
    const historyEntry = updateData.historyEntry;
    delete updateData.historyEntry;

    if (historyEntry) {
      updateData.$push = { history: historyEntry };
    }

    const updated = await documentModel.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const deleted = await documentModel.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDocuments, getDocument, generateDocument, getDocumentData, deleteDocument, updateDocument };
