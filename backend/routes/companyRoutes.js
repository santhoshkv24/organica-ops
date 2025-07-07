const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, companySchema } = require('../middleware/validationMiddleware');
const {
  getBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch
} = require('../controllers/companyController');

router.route('/')
  .get(protect, getBranches)
  .post(protect, authorize('admin'), validate(companySchema), createBranch);

router.route('/:id')
  .get(protect, getBranch)
  .put(protect, authorize('admin'), validate(companySchema), updateBranch)
  .delete(protect, authorize('admin'), deleteBranch);

module.exports = router;
