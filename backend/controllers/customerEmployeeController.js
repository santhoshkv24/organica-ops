const { callProcedure, getOneProcedure } = require('../utils/dbUtils');

// Create a new customer employee with user account and customer details
const createFullCustomerUser = async (req, res) => {
  try {
    const {
      customer_company_id,
      first_name,
      last_name,
      email,
      phone,
      position,
      is_head = false
    } = req.body;

    // Validate required fields
    if (!customer_company_id || !first_name || !last_name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    // Create employee with user account
    const result = await callProcedure('sp_CreateFullCustomerUser', [
      customer_company_id,
      first_name,
      last_name,
      email,
      phone,
      position || null,
      is_head,
      req.user?.id || 1 // Default to system user if not available
    ]);
    
    if (!result || result.length === 0) {
      throw new Error('Failed to create customer employee');
    }

    // The stored procedure returns the created employee with user info
    const newEmployee = result[0];

    res.status(201).json({
      success: true,
      message: 'Customer employee created successfully',
      data: newEmployee
    });
  } catch (error) {
    console.error('Error creating customer employee:', error);
    
    // Handle duplicate email error
    if (error.message.includes('Email already exists') || error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Email address is already in use'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create customer employee'
    });
  }
};

// Get all customer employees with user account status
const getCustomerEmployees = async (req, res) => {
  try {
    const { customerCompanyId } = req.params;
    
    const employees = await callProcedure('sp_GetCustomerEmployeesWithUserStatus', [customerCompanyId]);
    
    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    console.error('Error getting customer employees:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get customer employees'
    });
  }
};

// Get customer employee by ID with user info
const getCustomerEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await getOneProcedure('sp_GetCustomerEmployeeById', [id]);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Customer employee not found'
      });
    }
    
    // If employee has a user_id, get the user details
    if (employee.user_id) {
      const user = await getOneProcedure('sp_GetUserById', [employee.user_id]);
      if (user) {
        employee.user = {
          user_id: user.user_id,
          username: user.username,
          role: user.role,
          last_login: user.last_login
        };
      }
    }
    
    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error getting customer employee:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get customer employee'
    });
  }
};

// Create new customer employee with user account
const createCustomerEmployee = async (req, res) => {
  try {
    const {
      customer_company_id,
      first_name,
      last_name,
      email,
      phone,
      position,
      is_head = false
    } = req.body;

    // Validate required fields
    if (!customer_company_id || !first_name || !last_name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Create employee with user account
    const result = await callProcedure('sp_CreateCustomerEmployeeWithUser', [
      customer_company_id,
      first_name,
      last_name,
      email,
      phone,
      position || null,
      is_head,
      req.user?.id || 1 // Default to system user if not available
    ]);
    
    if (!result || result.length === 0) {
      throw new Error('Failed to create customer employee');
    }

    // The stored procedure returns the created employee with user info
    const newEmployee = result[0];

    res.status(201).json({
      success: true,
      message: 'Customer employee created successfully',
      data: newEmployee
    });
  } catch (error) {
    console.error('Error creating customer employee:', error);
    
    // Handle duplicate email error
    if (error.message.includes('Email already exists') || error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Email address is already in use'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create customer employee'
    });
  }
};

// Update customer employee and optionally their user account
const updateCustomerEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, position, is_head } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and email are required'
      });
    }

    // Get the current employee to check if is_head is being changed
    const currentEmployee = await getOneProcedure('sp_GetCustomerEmployeeById', [id]);
    if (!currentEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Customer employee not found'
      });
    }

    // Prevent changing is_head if it would violate constraints
    if (currentEmployee.is_head && is_head === false) {
      // Check if this is the only team head
      const teamHeads = await callProcedure('sp_GetCustomerEmployeesWithUserStatus', [currentEmployee.customer_company_id]);
      const activeTeamHeads = teamHeads.filter(emp => emp.is_head && emp.customer_employee_id !== parseInt(id));
      
      if (activeTeamHeads.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove the only team head. Please assign another team head first.'
        });
      }
    }

    // Update the employee
    const result = await callProcedure('sp_UpdateCustomerEmployee', [
      id,
      first_name,
      last_name,
      email,
      phone || null,
      position || null,
      is_head !== undefined ? is_head : currentEmployee.is_head
    ]);

    if (!result || result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Failed to update customer employee'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer employee updated successfully',
      data: result[0]
    });
  } catch (error) {
    console.error('Error updating customer employee:', error);
    
    // Handle duplicate email error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Email address is already in use'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update customer employee'
    });
  }
};

// Delete customer employee and optionally their user account
const deleteCustomerEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First get the employee to check if they have a user account
    const employee = await getOneProcedure('sp_GetCustomerEmployeeById', [id]);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Customer employee not found'
      });
    }

    // Delete the user account if it exists
    if (employee.user_id) {
      await callProcedure('sp_DeleteUser', [employee.user_id]);
    }

    // Now delete the employee
    const result = await callProcedure('sp_DeleteCustomerEmployee', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer employee not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Customer employee and associated user account (if any) deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer employee:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete customer employee'
    });
  }
};

module.exports = {
  createFullCustomerUser,
  getCustomerEmployees,
  getCustomerEmployeeById,
  createCustomerEmployee,
  updateCustomerEmployee,
  deleteCustomerEmployee
};