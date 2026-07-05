const express = require('express');
const router = express.Router();
const { getDocuments, getDocumentData, generateDocument, deleteDocument, updateDocument } = require('../../controllers/documentController');

router.route('/')
  .get(getDocuments)
  .post(generateDocument);

router.route('/:id/data')
  .get(getDocumentData);

router.route('/:id')
  .put(updateDocument)
  .delete(deleteDocument);

module.exports = router;
