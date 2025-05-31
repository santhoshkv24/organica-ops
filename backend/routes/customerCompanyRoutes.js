const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, customerCompanySchema } = require('../middleware/validationMiddleware');
const {
  getCustomerCompanies,
  getCustomerCompany,
  createCustomerCompany,
  updateCustomerCompany,
  deleteCustomerCompany
} = require('../controllers/customerCompanyController');

router.route('/')
  .get(protect, getCustomerCompanies)
  .post(protect, authorize('admin'), validate(customerCompanySchema), createCustomerCompany);

router.route('/:id')
  .get(protect, getCustomerCompany)
  .put(protect, authorize('admin'), validate(customerCompanySchema), updateCustomerCompany)
  .delete(protect, authorize('admin'), deleteCustomerCompany);

module.exports = router;
