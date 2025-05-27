const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, companySchema } = require('../middleware/validationMiddleware');
const {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany
} = require('../controllers/companyController');

router.route('/')
  .get(protect, getAllCompanies)
  .post(protect, authorize('admin'), validate(companySchema), createCompany);

router.route('/:id')
  .get(protect, getCompanyById)
  .put(protect, authorize('admin'), validate(companySchema), updateCompany)
  .delete(protect, authorize('admin'), deleteCompany);

module.exports = router;
