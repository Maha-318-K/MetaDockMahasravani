const qaIssuesModel = require('../models/qaIssuesModel');

const getQAIssues = async (req, res) => {
  try {
    const data = await qaIssuesModel.find().sort({ _id: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getQAIssue = async (req, res) => {
  try {
    const issue = await qaIssuesModel.findOne({ id: req.params.id });
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });
    res.json({ success: true, data: issue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createQAIssue = async (req, res) => {
  try {
    // Generate QA-2025-00100 format ID
    const latest = await qaIssuesModel.findOne({ issueId: /^QA-2025-/ }).sort({ issueId: -1 });
    let baseId = 100;
    if (latest && latest.issueId) {
      baseId = parseInt(latest.issueId.replace('QA-2025-', ''), 10);
    }
    const newId = `QA-2025-${String(baseId + 1).padStart(5, '0')}`;

    const issueData = req.body;
    const newIssue = new qaIssuesModel({
      id: Date.now().toString(),
      issueId: newId,
      project: issueData.project || '',
      module: issueData.module || '',
      pageName: issueData.pageName || '',
      issueTitle: issueData.issueTitle || '',
      type: issueData.type || 'Functional',
      severity: issueData.severity || 'Medium',
      priority: issueData.priority || 'P3',
      status: issueData.status || 'Open',
      assignedTo: issueData.assignedTo || '',
      raisedBy: issueData.raisedBy || '',
      raisedDate: issueData.raisedDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      attachmentsCount: issueData.attachmentsCount || 0,
      issueDetails: issueData.issueDetails || '',
      attachments: issueData.attachments || [],
      comments: issueData.comments || [],
      history: issueData.history || [{
        action: 'Created',
        by: issueData.raisedBy || 'System',
        date: new Date().toISOString()
      }],
      resolvedDate: issueData.resolvedDate || ''
    });

    await newIssue.save();
    res.status(201).json({ success: true, data: newIssue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateQAIssue = async (req, res) => {
  try {
    const updates = req.body;
    const existing = await qaIssuesModel.findOne({ id: req.params.id });
    if (!existing) return res.status(404).json({ success: false, message: 'Issue not found' });

    const oldStatus = existing.status;
    const newStatus = updates.status || oldStatus;
    
    if (oldStatus !== 'Resolved' && newStatus === 'Resolved') {
      const d = new Date();
      updates.resolvedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    if (updates.historyEntry) {
      updates.$push = updates.$push || {};
      updates.$push.history = updates.historyEntry;
      delete updates.historyEntry;
    }

    if (updates.newComment) {
      updates.$push = updates.$push || {};
      updates.$push.comments = updates.newComment;
      delete updates.newComment;
    }

    const updated = await qaIssuesModel.findOneAndUpdate(
      { id: req.params.id },
      updates,
      { new: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteQAIssue = async (req, res) => {
  try {
    const deleted = await qaIssuesModel.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Issue not found' });
    res.json({ success: true, message: 'Issue deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getQAIssues, getQAIssue, createQAIssue, updateQAIssue, deleteQAIssue };
