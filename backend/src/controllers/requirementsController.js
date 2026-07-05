const requirementsModel = require('../models/requirementsModel');

const getRequirements = async (req, res) => {
  try {
    const data = await requirementsModel.find().sort({ _id: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getRequirement = async (req, res) => {
  try {
    const reqData = await requirementsModel.findOne({ id: req.params.id });
    if (!reqData) return res.status(404).json({ success: false, message: 'Requirement not found' });
    res.json({ success: true, data: reqData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createRequirement = async (req, res) => {
  try {
    // Generate REQ-YYYY-XXXX ID
    const year = new Date().getFullYear();
    const prefix = `REQ-${year}-`;
    const latest = await requirementsModel.findOne({ id: new RegExp(`^${prefix}`) }).sort({ id: -1 });
    
    let newIdNum = 1;
    if (latest && latest.id) {
      newIdNum = parseInt(latest.id.replace(prefix, ''), 10) + 1;
    }
    const formattedId = `${prefix}${String(newIdNum).padStart(4, '0')}`;

    const newReq = new requirementsModel({
      id: formattedId,
      title: req.body.title || 'Untitled Requirement',
      module: req.body.module || 'General',
      description: req.body.description || '',
      priority: req.body.priority || 'Medium',
      status: req.body.status || 'Under Review',
      requestedBy: req.body.requestedBy || 'System',
      requestedDate: req.body.requestedDate || new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      targetDate: req.body.targetDate || '-',
      history: []
    });

    await newReq.save();
    res.status(201).json({ success: true, data: newReq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateRequirement = async (req, res) => {
  try {
    const updateData = { ...req.body };
    const historyEntry = updateData.historyEntry;
    delete updateData.historyEntry;

    if (historyEntry) {
      updateData.$push = { history: historyEntry };
    }

    const updated = await requirementsModel.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Requirement not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteRequirement = async (req, res) => {
  try {
    const deleted = await requirementsModel.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Requirement not found' });
    res.json({ success: true, message: 'Requirement deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getRequirements, getRequirement, createRequirement, updateRequirement, deleteRequirement };
