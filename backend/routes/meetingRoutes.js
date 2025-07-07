const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getMeetingsByTeam,
  getMeetingsByProject,
  getMeetingsByDateRange,
  getEmployeeMeetings,
  addParticipant,
  removeParticipant
} = require('../controllers/meetingController');

// Basic CRUD routes
router
  .route('/')
  .get(protect, getMeetings)
  .post(protect, createMeeting);

router
  .route('/:id')
  .get(protect, getMeeting)
  .put(protect, updateMeeting)
  .delete(protect, deleteMeeting);

// Additional routes
router.get('/team/:teamId', protect, getMeetingsByTeam);
router.get('/project/:projectId', protect, getMeetingsByProject);
router.get('/date-range', protect, getMeetingsByDateRange);
router.get('/employee/:employeeId?', protect, getEmployeeMeetings);

// Participant management
router.post('/participants', protect, addParticipant);
router.delete('/participants', protect, removeParticipant);

module.exports = router; 