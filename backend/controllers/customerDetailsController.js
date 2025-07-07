const { query, getOne, insert, update, remove, callProcedure, getOneProcedure } = require('../utils/dbUtils');

// Get all customers
const getCustomers = async (req, res) => {
  try {
    const customers = await callProcedure('sp_GetAllCustomerDetails', []);
    
    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    console.error('Error getting customers:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single customer
const getCustomer = async (req, res) => {
  try {
    const customer = await getOneProcedure('sp_GetCustomerDetailsById', [req.params.id]);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error getting customer:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create customer
const createCustomer = async (req, res) => {
  try {
    const {
      customer_company_id,
      first_name,
      last_name,
      email,
      phone,
      position
    } = req.body;

    // Check if company exists
    if (customer_company_id) {
      const company = await getOneProcedure('sp_GetCustomerCompanyById', [customer_company_id]);

      if (!company) {
        return res.status(404).json({ message: 'Customer company not found' });
      }
    }

    // Check if email is unique
    const emailCheck = await callProcedure('sp_CheckCustomerEmailExists', [email, 0]);

    if (emailCheck[0]?.email_count > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Create customer using stored procedure
    const result = await callProcedure('sp_CreateCustomerDetails', [
      customer_company_id,
      first_name,
      last_name,
      email,
      phone,
      position
    ]);

    const customerId = result[0]?.customer_id;

    // Get the created customer
    const customer = await getOneProcedure('sp_GetCustomerDetailsById', [customerId]);

    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update customer
const updateCustomer = async (req, res) => {
  try {
    const {
      customer_company_id,
      first_name,
      last_name,
      email,
      phone,
      position
    } = req.body;

    // Check if customer exists
    const existingCustomer = await getOneProcedure('sp_GetCustomerDetailsById', [req.params.id]);
    
    if (!existingCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if company exists
    if (customer_company_id) {
      const company = await getOneProcedure('sp_GetCustomerCompanyById', [customer_company_id]);

      if (!company) {
        return res.status(404).json({ message: 'Customer company not found' });
      }
    }

    // Check if email is unique (excluding current customer)
    if (email && email !== existingCustomer.email) {
      const emailCheck = await callProcedure('sp_CheckCustomerEmailExists', [email, req.params.id]);

      if (emailCheck[0]?.email_count > 0) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Update customer using stored procedure
    await callProcedure('sp_UpdateCustomerDetails', [
      req.params.id,
        customer_company_id,
        first_name,
        last_name,
        email,
        phone,
        position
    ]);

    // Get the updated customer
    const customer = await getOneProcedure('sp_GetCustomerDetailsById', [req.params.id]);

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete customer
const deleteCustomer = async (req, res) => {
  try {
    // Check if customer exists
    const customer = await getOneProcedure('sp_GetCustomerDetailsById', [req.params.id]);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Delete customer using stored procedure
    await callProcedure('sp_DeleteCustomerDetails', [req.params.id]);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
