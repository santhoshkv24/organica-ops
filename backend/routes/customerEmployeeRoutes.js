const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getCustomerEmployees,
  getCustomerEmployeeById,
  createCustomerEmployee,
  updateCustomerEmployee,
  deleteCustomerEmployee,
  createFullCustomerUser
} = require('../controllers/customerEmployeeController');

// All routes are protected
router.use(protect);

// Only admins, managers, and customer_heads can manage customer employees
const canManageCustomerEmployees = authorize('admin', 'manager', 'customer_head');

router.post('/full', canManageCustomerEmployees, createFullCustomerUser);

// Get all employees for a specific customer company
// Accessible by: admin, manager, customer_head (for their company)
router.get('/company/:customerCompanyId', 
  authorize('admin', 'manager', 'customer_head'),
  getCustomerEmployees
);

// Get a single customer employee by ID
// Accessible by: admin, manager, customer_head (for their company), or the employee themselves
router.get('/:id', 
  authorize('admin', 'manager', 'customer_head', 'customer_employee'),
  getCustomerEmployeeById
);

// Create a new customer employee
// Accessible by: admin, manager, customer_head (for their company)
router.post('/',
  canManageCustomerEmployees,
  createCustomerEmployee
);

// Update a customer employee
// Accessible by: admin, manager, customer_head (for their company), or the employee themselves
router.put('/:id',
  authorize('admin', 'manager', 'customer_head', 'customer_employee'),
  updateCustomerEmployee
);

// Delete a customer employee
// Accessible by: admin, manager, customer_head (for their company)
router.delete('/:id',
  canManageCustomerEmployees,
  deleteCustomerEmployee
);

// Additional routes for team management
router.post('/:id/assign-to-project', 
  canManageCustomerEmployees,
  async (req, res) => {
    // Implementation for assigning employee to a project
    // This would call a controller function to handle the assignment
  }
);

router.post('/:id/set-as-team-head', 
  authorize('admin', 'manager'), // Only admins and managers can set team heads
  async (req, res) => {
    // Implementation for setting an employee as team head
    // This would call a controller function to update the role
  }
);

module.exports = router;