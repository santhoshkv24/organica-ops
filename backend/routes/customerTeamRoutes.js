const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const customerTeamController = require('../controllers/customerTeamController');

// All routes are protected
router.use(protect);

// Define role groups for easier authorization
const adminManagerRoles = authorize('admin', 'manager');
const customerHeadRole = authorize('customer_head');
const allRoles = authorize('admin', 'manager', 'team_lead', 'employee', 'customer_head', 'customer_employee');

// Get project by customer head ID
router.get('/customer-head/:customerHeadId/project', customerHeadRole, customerTeamController.getProjectIdByCustomerHeadId);

// Get customer employees by project
router.get('/project/:projectId/employees', allRoles, customerTeamController.getCustomerEmployeesByProject);

// Get customer heads by project
router.get('/project/:projectId/heads', allRoles, customerTeamController.getCustomerHeadsByProject);

// Assign/Remove customer team head - only admins and managers can do this
router.post('/assign-head', adminManagerRoles, customerTeamController.assignCustomerTeamHead);
router.delete('/project/:projectId/head', adminManagerRoles, customerTeamController.removeCustomerTeamHead);

// Get all customer team members - accessible by all roles
router.get('/', allRoles, customerTeamController.getCustomerTeamMembers);

module.exports = router;
