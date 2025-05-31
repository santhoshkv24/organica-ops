const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, customerDetailsSchema } = require('../middleware/validationMiddleware');
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerDetailsController');

router.route('/')
  .get(protect, getCustomers)
  .post(protect, authorize('admin'), validate(customerDetailsSchema), createCustomer);

router.route('/:id')
  .get(protect, getCustomer)
  .put(protect, authorize('admin'), validate(customerDetailsSchema), updateCustomer)
  .delete(protect, authorize('admin'), deleteCustomer);

module.exports = router;
