const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, departmentSchema } = require('../middleware/validationMiddleware');
const {
  getAllDepartments,
  getDepartmentById,
  getDepartmentsByCompany,
  createDepartment,
  updateDepartment,
  deleteDepartment
} = require('../controllers/departmentController');

router.route('/')
  .get(protect, getAllDepartments)
  .post(protect, authorize('admin'), validate(departmentSchema), createDepartment);

router.route('/:id')
  .get(protect, getDepartmentById)
  .put(protect, authorize('admin'), validate(departmentSchema), updateDepartment)
  .delete(protect, authorize('admin'), deleteDepartment);

router.route('/company/:companyId')
  .get(protect, getDepartmentsByCompany);

module.exports = router;
