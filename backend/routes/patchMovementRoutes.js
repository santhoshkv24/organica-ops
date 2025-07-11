const express = require('express');
const router = express.Router();
const patchMovementController = require('../controllers/patchMovementController');
const { protect } = require('../middleware/authMiddleware');

// Create a new patch movement request
router.post('/', protect, patchMovementController.createPatchMovementRequest);

// Get all patch movement requests for a project
router.get('/project/:project_id', protect, patchMovementController.getPatchMovementRequestsByProject);

// Get a patch movement request by ID
router.get('/:patch_id', protect, patchMovementController.getPatchMovementRequestById);

// Update the status of a patch movement request
router.put('/:patch_id/status', protect, patchMovementController.updatePatchMovementRequestStatus);

// Get patch movement requests by team lead ID
router.get('/team-lead/:teamLeadId', protect, patchMovementController.getPatchMovementRequestByTeamLeadId);

// Get patch movement requests by user (requester)
router.get('/user/:userId?', protect, patchMovementController.getPatchMovementRequestsByUser);

module.exports = router;
