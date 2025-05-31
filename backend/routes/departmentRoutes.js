const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, departmentSchema } = require('../middleware/validationMiddleware');
const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment
} = require('../controllers/departmentController');

router.route('/')
  .get(protect, getDepartments)
  .post(protect, authorize('admin'), validate(departmentSchema), createDepartment);

router.route('/:id')
  .get(protect, getDepartment)
  .put(protect, authorize('admin'), validate(departmentSchema), updateDepartment)
  .delete(protect, authorize('admin'), deleteDepartment);

module.exports = router;
