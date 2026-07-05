const express = require('express');
const router = express.Router();
const whatsappController = require('../../controllers/whatsappController');

router.get('/status', whatsappController.getStatus);
router.get('/chats', whatsappController.getChats);
router.post('/groups', whatsappController.setGroups);
router.post('/issue-group', whatsappController.setIssueGroup);
router.post('/send-issue', whatsappController.sendIssue);
router.post('/send-document', whatsappController.sendDocument);
router.get('/metrics', whatsappController.getMetrics);
router.post('/disconnect', whatsappController.disconnect);

module.exports = router;
