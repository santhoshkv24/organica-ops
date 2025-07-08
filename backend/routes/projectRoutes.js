const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectsByTeam,
  getProjectsByManager,
  getProjectsByUser
} = require('../controllers/projectController');

// Basic CRUD routes
router
  .route('/')
  .get(protect, getProjects)
  .post(protect, authorize('admin', 'manager'), createProject);

router
  .route('/:id')
  .get(protect, getProject)
  .put(protect, authorize('admin', 'manager'), updateProject)
  .delete(protect, authorize('admin', 'manager'), deleteProject);

// Additional routes
router.get('/team/:teamId', protect, getProjectsByTeam);
router.get('/manager/:managerId', protect, getProjectsByManager);
router.get('/user/:userId', protect, getProjectsByUser);

module.exports = router;