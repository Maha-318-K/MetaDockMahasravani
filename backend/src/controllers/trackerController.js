const Tracker = require('../models/trackerModel');
const getTrackerDoc = async () => {
  let doc = await Tracker.findOne();
  if (!doc) {
    doc = new Tracker();
    await doc.save();
  }
  return doc;
};

const getTracker = async (req, res) => {
  try {
    const doc = await getTrackerDoc();
    const meetingId = req.params.meetingId;
    const data = (doc.trackerData && doc.trackerData[meetingId]) ? doc.trackerData[meetingId] : [];
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const appSettingsModel = require('../models/appSettingsModel');
const requirementsModel = require('../models/requirementsModel');

const saveTracker = async (req, res) => {
  try {
    const meetingId = req.params.meetingId;
    let points = req.body.points || req.body;
    
    if (Array.isArray(points)) {
      const settings = appSettingsModel.getSettings ? appSettingsModel.getSettings() : {};
      const triggerStatuses = settings.requirementTriggerStatuses || [];

      points = await Promise.all(points.map(async point => {
        if (triggerStatuses.includes(point.col3) && !point.movedToRequirement) {
          if (requirementsModel.createRequirement) {
            // using legacy for requirementsModel if it hasn't fully updated yet, wait, requirementsModel IS updated to mongoose!
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
              title: point.col2 || 'Untitled Point',
              module: point.col1 || 'General',
              description: `Imported from MoM Tracker: ${point.col2}`,
              requestedBy: point.col4 || 'System',
              priority: 'Medium',
              status: 'Under Review'
            });
            await newReq.save();
          }
          return { ...point, movedToRequirement: true };
        }
        return point;
      }));
    }

    const doc = await getTrackerDoc();
    
    if (!doc.trackerData) doc.trackerData = {};
    doc.trackerData[meetingId] = points;
    doc.markModified('trackerData');
    
    await doc.save();
    res.status(200).json({ success: true, data: doc.trackerData[meetingId] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const getSettings = async (req, res) => {
  try {
    const doc = await getTrackerDoc();
    res.status(200).json({ 
      success: true, 
      data: {
        columns: doc.customColumns,
        statuses: doc.customStatuses
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const updateColumns = async (req, res) => {
  try {
    const doc = await getTrackerDoc();
    doc.customColumns = { ...doc.customColumns, ...(req.body.columns || req.body) };
    await doc.save();
    res.status(200).json({ success: true, data: doc.customColumns });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const addStatus = async (req, res) => {
  try {
    const doc = await getTrackerDoc();
    const newStatus = req.body.status || req.body;
    
    const exists = doc.customStatuses.find(s => s.name.toLowerCase() === newStatus.name.toLowerCase());
    if (!exists) {
      doc.customStatuses.push(newStatus);
      await doc.save();
    }
    res.status(201).json({ success: true, data: doc.customStatuses });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

module.exports = {
  getTracker,
  saveTracker,
  getSettings,
  updateColumns,
  addStatus
};
