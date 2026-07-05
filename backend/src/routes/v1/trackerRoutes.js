const express = require('express');
const router = express.Router();
const { getTracker, saveTracker, getSettings, updateColumns, addStatus } = require('../../controllers/trackerController');

router.route('/settings')
  .get(getSettings);

router.route('/settings/columns')
  .put(updateColumns);

router.route('/settings/statuses')
  .post(addStatus);

router.route('/:meetingId')
  .get(getTracker)
  .post(saveTracker);

module.exports = router;
