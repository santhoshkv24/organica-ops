const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, customerCompanySchema } = require('../middleware/validationMiddleware');
const {
  getAllCustomerCompanies,
  getCustomerCompanyById,
  createCustomerCompany,
  updateCustomerCompany,
  deleteCustomerCompany
} = require('../controllers/customerCompanyController');

router.route('/')
  .get(protect, getAllCustomerCompanies)
  .post(protect, authorize('admin'), validate(customerCompanySchema), createCustomerCompany);

router.route('/:id')
  .get(protect, getCustomerCompanyById)
  .put(protect, authorize('admin'), validate(customerCompanySchema), updateCustomerCompany)
  .delete(protect, authorize('admin'), deleteCustomerCompany);

module.exports = router;
