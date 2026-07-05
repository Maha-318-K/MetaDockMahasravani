const express = require('express');
const router = express.Router();
const { getQAIssues, getQAIssue, createQAIssue, updateQAIssue, deleteQAIssue } = require('../../controllers/qaIssuesController');

router.route('/')
  .get(getQAIssues)
  .post(createQAIssue);

router.route('/:id')
  .get(getQAIssue)
  .put(updateQAIssue)
  .delete(deleteQAIssue);

module.exports = router;
