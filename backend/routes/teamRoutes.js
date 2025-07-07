const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, teamSchema } = require('../middleware/validationMiddleware');
const {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamsByBranch,
  assignTeamLead,
  getTeamLeads,
  removeTeamLead,
  getMyTeamLeads,
  getTeamMembers,
  getTeamLeadStatus
} = require('../controllers/teamController');

router
  .route('/')
  .get(protect, getTeams)
  .post(protect, authorize('admin', 'manager'), validate(teamSchema), createTeam);

// Get teams by branch - IMPORTANT: Place this route BEFORE '/:id' to avoid conflicts
router.get('/branch/:branchId', protect, getTeamsByBranch);

router
  .route('/:id')
  .get(protect, getTeam)
  .put(protect, authorize('admin', 'manager'), validate(teamSchema), updateTeam)
  .delete(protect, authorize('admin'), deleteTeam);

// Team Lead Management Routes
router.get('/:teamId/leads', protect, getTeamLeads);
router.post('/:teamId/leads', protect, authorize('admin', 'manager'), assignTeamLead);
router.delete('/leads/:teamLeadId', protect, authorize('admin', 'manager'), removeTeamLead);

// Get teams where current user is a team lead
router.get('/my/leads', protect, getMyTeamLeads);

// Get team members (employees in a team)
router.get('/:teamId/members', protect, getTeamMembers);

// Get team lead status for a specific employee
router.get('/employee/:employeeId/lead-status', protect, getTeamLeadStatus);

module.exports = router;
