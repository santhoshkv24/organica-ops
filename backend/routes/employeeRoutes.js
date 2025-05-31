const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, employeeSchema } = require('../middleware/validationMiddleware');
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');

router
  .route('/')
  .get(protect, getEmployees)
  .post(protect, authorize('admin'), validate(employeeSchema), createEmployee);

router
  .route('/:id')
  .get(protect, getEmployee)
  .put(protect, authorize('admin'), validate(employeeSchema), updateEmployee)
  .delete(protect, authorize('admin'), deleteEmployee);

module.exports = router;
