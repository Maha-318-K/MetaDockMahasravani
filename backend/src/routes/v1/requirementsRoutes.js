const express = require('express');
const router = express.Router();
const requirementsController = require('../../controllers/requirementsController');

router.get('/', requirementsController.getRequirements);
router.post('/', requirementsController.createRequirement);
router.get('/:id', requirementsController.getRequirement);
router.put('/:id', requirementsController.updateRequirement);
router.delete('/:id', requirementsController.deleteRequirement);

module.exports = router;
