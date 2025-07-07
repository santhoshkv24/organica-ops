const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const projectTeamMemberController = require('../controllers/projectTeamMemberController');

// All routes are protected
router.use(protect);

// Only admins and managers can manage project team members
const adminOrManager = authorize('admin', 'manager');

// Routes for project team members
router.route('/')
  .post(adminOrManager, projectTeamMemberController.addProjectTeamMember);

router.route('/:id')
  .put(adminOrManager, projectTeamMemberController.updateProjectTeamMember)
  .delete(adminOrManager, projectTeamMemberController.removeProjectTeamMember);

// Get my projects
router.get('/my-projects', projectTeamMemberController.getMyProjects);

// Get team members for a project
router.get('/project/:projectId', projectTeamMemberController.getProjectTeamMembers);

// Get projects for an employee
router.get('/employee/:employeeId', projectTeamMemberController.getEmployeeProjects);

// Get team members by role
router.get('/project/:projectId/role', projectTeamMemberController.getProjectTeamMembersByRole);

module.exports = router; 