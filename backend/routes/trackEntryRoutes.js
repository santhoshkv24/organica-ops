// backend/routes/trackEntryRoutes.js
const express = require('express');
const router = express.Router();
const trackEntryController = require('../controllers/trackEntryController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected and require authentication
router.use(protect);

// Track entry routes
router
    .route('/')
    .get(trackEntryController.getTrackEntries)
    .post(authorize('admin', 'manager', 'team_lead'), trackEntryController.createTrackEntry);

// Dashboard and statistics - IMPORTANT: These must come BEFORE the /:id route
router.get('/dashboard/summary', trackEntryController.getDashboardData);
router.get('/statistics', trackEntryController.getTaskStatistics);

// Utility endpoints - IMPORTANT: These must come BEFORE the /:id route
router.get('/assignable-employees', trackEntryController.getAssignableEmployees);

// Filter routes - IMPORTANT: These must come BEFORE the /:id route
router.get('/assigned-by/:assignedById', trackEntryController.getTrackEntriesByAssignedBy);
router.get('/employee/:employeeId', trackEntryController.getTrackEntriesByEmployee);
router.get('/project-manager/:managerId', trackEntryController.getProjectManagerTasks);
router.get('/team-lead/:teamLeadId', trackEntryController.getTeamLeadTasks);

// Task actions - These use the :id parameter
router.put('/:id/status', trackEntryController.updateTrackEntryStatus);
router.post('/:id/log-hours', trackEntryController.logHoursWorked);
router.post('/:id/transfer', authorize('admin', 'manager', 'team_lead'), trackEntryController.transferTask);

// Individual track entry routes - This should come AFTER all other specific routes
router
    .route('/:id')
    .get(trackEntryController.getTrackEntry)
    .put(trackEntryController.updateTrackEntry)
    .delete(authorize('admin', 'manager'), trackEntryController.deleteTrackEntry);

module.exports = router;