const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const customerTrackEntryController = require('../controllers/customerTrackEntryController');

// All routes are protected
router.use(protect);

// Define role groups for easier authorization
const adminManagerRoles = authorize('admin', 'manager');
const employeeRoles = authorize('admin', 'manager', 'team_lead', 'employee');
const customerRoles = authorize('customer_head', 'customer_employee');
const customerHeadOnly = authorize('customer_head');
const allRoles = authorize('admin', 'manager', 'team_lead', 'employee', 'customer_head', 'customer_employee');

// Routes for customer track entries
router
  .route('/')
  .get(allRoles, customerTrackEntryController.getCustomerTrackEntries)
  .post(customerRoles, customerTrackEntryController.createCustomerTrackEntry);

// Dashboard route for customer users
router.get('/dashboard/summary', customerRoles, customerTrackEntryController.getCustomerDashboardData);

// Company tasks route - restricted to customer team heads only
router.get('/company-tasks', customerHeadOnly, customerTrackEntryController.getCustomerCompanyTasks);

// Get entries by assigned_by
router.get('/assigned-by/:assignedById', allRoles, customerTrackEntryController.getCustomerTrackEntriesByAssignedBy);

// Project specific route 
router.get('/project/:projectId', allRoles, customerTrackEntryController.getCustomerTrackEntries);

// Individual track entry routes
router
  .route('/:id')
  .get(allRoles, customerTrackEntryController.getCustomerTrackEntry)
  .put(allRoles, customerTrackEntryController.updateCustomerTrackEntry)
  .delete(adminManagerRoles, customerTrackEntryController.deleteCustomerTrackEntry);

// Status update route - both employees and customers can update status
router.put('/:id/status', allRoles, customerTrackEntryController.updateCustomerTrackEntryStatus);

module.exports = router; 