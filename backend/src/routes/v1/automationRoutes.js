const express = require('express');
const router = express.Router();
const { getAutomations, getAutomation, createAutomation, updateAutomation, deleteAutomation } = require('../../controllers/automationController');

router.route('/')
  .get(getAutomations)
  .post(createAutomation);

router.route('/:id')
  .get(getAutomation)
  .put(updateAutomation)
  .delete(deleteAutomation);

module.exports = router;
