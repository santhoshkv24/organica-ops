const express = require('express');
const router = express.Router();
const inventoryLoanController = require('../controllers/inventoryLoanController');
const { protect } = require('../middleware/authMiddleware');

// Create a new inventory loan
router.post('/', protect, inventoryLoanController.createInventoryLoan);

// Approve or reject a loan
router.put('/:loan_id/approve', protect, inventoryLoanController.approveRejectInventoryLoan);

// Assign & issue items
router.put('/:loan_id/issue', protect, inventoryLoanController.issueInventoryLoan);

// Return items
router.put('/:loan_id/return', protect, inventoryLoanController.returnInventoryLoanItems);

// Get loans by user
router.get('/user/:userId?', protect, inventoryLoanController.getInventoryLoansByUser);

// Get loan details by ID
router.get('/:loan_id', protect, inventoryLoanController.getInventoryLoanDetails);

// Get loans by project
router.get('/project/:project_id', protect, inventoryLoanController.getInventoryLoansByProject);

// Get pending approvals for team leads
router.get('/team/:team_id/pending', protect, inventoryLoanController.getInventoryLoansPendingApproval);

// Get loans by team
router.get('/team/:team_id', protect, inventoryLoanController.getInventoryLoansByTeam);

module.exports = router;
