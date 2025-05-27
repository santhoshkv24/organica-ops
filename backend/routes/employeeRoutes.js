const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, employeeSchema } = require('../middleware/validationMiddleware');
const {
  getAllEmployees,
  getEmployeeById,
  getEmployeesByDepartment,
  getEmployeesByTeam,
  getEmployeesByCompany,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');

router.route('/')
  .get(protect, getAllEmployees)
  .post(protect, authorize('admin'), validate(employeeSchema), createEmployee);

router.route('/:id')
  .get(protect, getEmployeeById)
  .put(protect, authorize('admin'), validate(employeeSchema), updateEmployee)
  .delete(protect, authorize('admin'), deleteEmployee);

router.route('/department/:departmentId')
  .get(protect, getEmployeesByDepartment);

router.route('/team/:teamId')
  .get(protect, getEmployeesByTeam);

router.route('/company/:companyId')
  .get(protect, getEmployeesByCompany);

module.exports = router;
