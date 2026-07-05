const express = require('express');
const router = express.Router();
const { getIssues, getIssue, createIssue, updateIssue, deleteIssue } = require('../../controllers/issuesController');

// GET /api/v1/issues  — list all
// POST /api/v1/issues — create one
router.route('/')
  .get(getIssues)
  .post(createIssue);

// GET /api/v1/issues/:id — get one
// PUT /api/v1/issues/:id  — update (field-level inline edit)
// DELETE /api/v1/issues/:id — delete one
router.route('/:id')
  .get(getIssue)
  .put(updateIssue)
  .delete(deleteIssue);

module.exports = router;
