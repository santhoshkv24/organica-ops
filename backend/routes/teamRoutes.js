const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, teamSchema } = require('../middleware/validationMiddleware');
const {
  getAllTeams,
  getTeamById,
  getTeamsByDepartment,
  getTeamsByCompany,
  createTeam,
  updateTeam,
  deleteTeam
} = require('../controllers/teamController');

router.route('/')
  .get(protect, getAllTeams)
  .post(protect, authorize('admin'), validate(teamSchema), createTeam);

router.route('/:id')
  .get(protect, getTeamById)
  .put(protect, authorize('admin'), validate(teamSchema), updateTeam)
  .delete(protect, authorize('admin'), deleteTeam);

router.route('/department/:departmentId')
  .get(protect, getTeamsByDepartment);

router.route('/company/:companyId')
  .get(protect, getTeamsByCompany);

module.exports = router;
