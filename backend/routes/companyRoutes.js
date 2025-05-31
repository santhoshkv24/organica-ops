const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, companySchema } = require('../middleware/validationMiddleware');
const {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany
} = require('../controllers/companyController');

router.route('/')
  .get(protect, getCompanies)
  .post(protect, authorize('admin'), validate(companySchema), createCompany);

router.route('/:id')
  .get(protect, getCompany)
  .put(protect, authorize('admin'), validate(companySchema), updateCompany)
  .delete(protect, authorize('admin'), deleteCompany);

module.exports = router;
