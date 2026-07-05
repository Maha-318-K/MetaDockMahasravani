const issuesModel = require('../models/issuesModel');
const appSettingsModel = require('../models/appSettingsModel'); // TODO: update settings to Mongoose
const requirementsModel = require('../models/requirementsModel'); // TODO: update requirements to Mongoose

// GET /api/v1/issues
const getIssues = async (req, res) => {
  try {
    const data = await issuesModel.find().sort({ _id: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/issues/:id
const getIssue = async (req, res) => {
  try {
    // Some routes may query by MongoDB _id or the custom PI-0001 string ID.
    const issue = await issuesModel.findOne({ $or: [{ _id: req.params.id }, { id: req.params.id }] }).catch(() => null);
    if (!issue) {
      const byStringId = await issuesModel.findOne({ id: req.params.id });
      if (!byStringId) return res.status(404).json({ success: false, message: 'Issue not found' });
      return res.json({ success: true, data: byStringId });
    }
    res.json({ success: true, data: issue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/issues
const createIssue = async (req, res) => {
  try {
    // Generate PI-000X ID
    const latest = await issuesModel.findOne({ id: /^PI-/ }).sort({ id: -1 });
    let newIdNum = 1;
    if (latest && latest.id) {
      newIdNum = parseInt(latest.id.replace('PI-', ''), 10) + 1;
    }
    const formattedId = `PI-${String(newIdNum).padStart(4, '0')}`;

    const newIssue = new issuesModel({
      id: formattedId,
      pageName:    req.body.pageName   || '',
      issue:       req.body.issue      || '',
      status:      req.body.status     || 'Open',
      assignee:    req.body.assignee   || '',
      deployDate:  req.body.deployDate || '-',
      raisedDate:  req.body.raisedDate || new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      raisedSrc:   req.body.raisedSrc  || '',
      attachments: req.body.attachments || [],
      history:     [],
      priority:    req.body.priority   || 'Medium',
      duplicateCount: 0,
      logs:        []
    });

    await newIssue.save();
    res.status(201).json({ success: true, data: newIssue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/issues/:id
const updateIssue = async (req, res) => {
  try {
    const historyEntry = req.body.historyEntry;
    const updateData = { ...req.body };
    delete updateData.historyEntry;

    if (historyEntry) {
      updateData.$push = { history: historyEntry };
    }

    const updated = await issuesModel.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Issue not found' });

    // Auto-create requirement logic (keeping it synchronous for now since requirementsModel uses JSON)
    const settings = appSettingsModel.getSettings ? appSettingsModel.getSettings() : {};
    const triggerStatuses = settings.requirementTriggerStatuses || [];
    if (triggerStatuses.includes(updated.status) && !updated.movedToRequirement) {
      if (requirementsModel.createRequirement) {
        requirementsModel.createRequirement({
          title: updated.issue,
          module: updated.pageName,
          description: `Imported from Production Issue ${updated.id}: ${updated.issue}`,
          requestedBy: updated.assignee || 'System',
          priority: updated.priority || 'Medium',
          status: 'Under Review'
        });
      }
      await issuesModel.findOneAndUpdate({ id: req.params.id }, { movedToRequirement: true });
      updated.movedToRequirement = true;
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/v1/issues/:id
const deleteIssue = async (req, res) => {
  try {
    const deleted = await issuesModel.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Issue not found' });
    res.json({ success: true, message: 'Issue deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getIssues, getIssue, createIssue, updateIssue, deleteIssue };
