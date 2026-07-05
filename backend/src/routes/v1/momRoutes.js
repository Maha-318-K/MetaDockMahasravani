const express = require('express');
const router = express.Router();
const { getMeetings, createMeeting, deleteMeeting, uploadDocument } = require('../../controllers/momController');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Route: /api/v1/mom/upload
router.post('/upload', upload.single('file'), uploadDocument);

// Route: /api/v1/mom
router.route('/')
  .get(getMeetings)
  .post(createMeeting);

// Route: /api/v1/mom/:id
router.route('/:id')
  .delete(deleteMeeting);

module.exports = router;
