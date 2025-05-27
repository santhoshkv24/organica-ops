const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, customerDetailsSchema } = require('../middleware/validationMiddleware');
const {
  getAllCustomerDetails,
  getCustomerDetailsById,
  getCustomersByCompany,
  createCustomerDetails,
  updateCustomerDetails,
  deleteCustomerDetails
} = require('../controllers/customerDetailsController');

router.route('/')
  .get(protect, getAllCustomerDetails)
  .post(protect, authorize('admin'), validate(customerDetailsSchema), createCustomerDetails);

router.route('/:id')
  .get(protect, getCustomerDetailsById)
  .put(protect, authorize('admin'), validate(customerDetailsSchema), updateCustomerDetails)
  .delete(protect, authorize('admin'), deleteCustomerDetails);

router.route('/company/:companyId')
  .get(protect, getCustomersByCompany);

module.exports = router;
