const automationModel = require('../models/automationModel');

const getAutomations = async (req, res) => {
  try {
    const data = await automationModel.find().sort({ _id: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAutomation = async (req, res) => {
  try {
    const data = await automationModel.findOne({ id: req.params.id });
    if (!data) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createAutomation = async (req, res) => {
  try {
    const data = req.body;
    const total = parseInt(data.totalTestCases) || 0;
    const automated = parseInt(data.automatedCases) || 0;
    
    let status = 'Not Started';
    if (total > 0 && automated === total) {
      status = 'Completed';
    } else if (automated > 0) {
      status = 'In Progress';
    }

    const newRecord = new automationModel({
      id: Date.now().toString(),
      project: data.project || '',
      module: data.module || '',
      pageName: data.pageName || '',
      totalTestCases: total,
      automatedCases: automated,
      status: status,
      lastUpdated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    });

    await newRecord.save();
    res.status(201).json({ success: true, data: newRecord });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateAutomation = async (req, res) => {
  try {
    const updates = req.body;
    
    // Fetch to compute status if we are updating counts
    let doc = await automationModel.findOne({ id: req.params.id });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    
    const total = updates.totalTestCases !== undefined ? parseInt(updates.totalTestCases) : doc.totalTestCases;
    const automated = updates.automatedCases !== undefined ? parseInt(updates.automatedCases) : doc.automatedCases;
    
    let status = 'Not Started';
    if (total > 0 && automated === total) {
      status = 'Completed';
    } else if (automated > 0) {
      status = 'In Progress';
    }
    
    const updateData = {
      ...updates,
      status,
      lastUpdated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    const updated = await automationModel.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteAutomation = async (req, res) => {
  try {
    const deleted = await automationModel.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAutomations, getAutomation, createAutomation, updateAutomation, deleteAutomation };
