const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, employeeSchema } = require('../middleware/validationMiddleware');
const { uploadExcel } = require('../middleware/uploadMiddleware');
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeesByTeam,
  getEmployeesByBranch,
  importEmployees,
} = require('../controllers/employeeController');

router
  .route('/')
  .get(protect, getEmployees)
  .post(protect, authorize('admin', 'manager'), validate(employeeSchema), createEmployee);

router.post('/import', protect, authorize('admin', 'manager'), uploadExcel.single('file'), importEmployees);

router
  .route('/:id')
  .get(protect, getEmployee)
  .put(protect, authorize('admin', 'manager'), validate(employeeSchema), updateEmployee)
  .delete(protect, authorize('admin'), deleteEmployee);

router.get('/team/:teamId', protect, getEmployeesByTeam);
router.get('/branch/:branchId', protect, getEmployeesByBranch);

module.exports = router;
