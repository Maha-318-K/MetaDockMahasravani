const appSettingsModel = require('../models/appSettingsModel');

const getSettingsDoc = async () => {
  let doc = await appSettingsModel.findOne();
  if (!doc) {
    doc = new appSettingsModel();
    await doc.save();
  }
  return doc;
};

const getSettings = async (req, res) => {
  try {
    const data = await getSettingsDoc();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const doc = await getSettingsDoc();
    Object.assign(doc, req.body);
    await doc.save();
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSettings, updateSettings };
