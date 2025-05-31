const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, teamSchema } = require('../middleware/validationMiddleware');
const {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam
} = require('../controllers/teamController');

router
  .route('/')
  .get(protect, getTeams)
  .post(protect, authorize('admin'), validate(teamSchema), createTeam);

router
  .route('/:id')
  .get(protect, getTeam)
  .put(protect, authorize('admin'), validate(teamSchema), updateTeam)
  .delete(protect, authorize('admin'), deleteTeam);

module.exports = router;
