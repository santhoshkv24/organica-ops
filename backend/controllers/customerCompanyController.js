const { query, getOne, insert, update, remove, callProcedure, getOneProcedure } = require('../utils/dbUtils');

// Get all customer companies
const getCustomerCompanies = async (req, res) => {
  try {
    const companies = await callProcedure('sp_GetAllCustomerCompanies', []);
    
    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error) {
    console.error('Error getting customer companies:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single customer company
const getCustomerCompany = async (req, res) => {
  try {
    const company = await getOneProcedure('sp_GetCustomerCompanyById', [req.params.id]);

    if (!company) {
      return res.status(404).json({ message: 'Customer company not found' });
    }

    // Get customers of this company - we'll need to add a stored procedure for this
    // For now, we'll use the query function
    const customers = await query(`
      SELECT * FROM customer_details
      WHERE customer_company_id = ?
      ORDER BY created_at DESC
    `, [req.params.id]);

    company.customers = customers;
    company.total_customers = customers.length;

    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Error getting customer company:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create customer company
const createCustomerCompany = async (req, res) => {
  try {
    const { name, industry, address, contact_email, contact_phone } = req.body;

    // Check if company with same name exists
    const nameCheck = await callProcedure('sp_CheckCustomerCompanyNameExists', [name, 0]);
    
    if (nameCheck[0]?.name_count > 0) {
      return res.status(400).json({ message: 'Customer company with this name already exists' });
    }

    // Create customer company using stored procedure
    const result = await callProcedure('sp_CreateCustomerCompany', [
      name,
      industry,
      address,
      contact_email,
      contact_phone
    ]);

    const companyId = result[0]?.customer_company_id;

    // Get the created company
    const company = await getOneProcedure('sp_GetCustomerCompanyById', [companyId]);
    company.total_customers = 0; // New company has no customers yet

    res.status(201).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Error creating customer company:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update customer company
const updateCustomerCompany = async (req, res) => {
  try {
    const { name, industry, address, contact_email, contact_phone } = req.body;

    // Check if company exists
    const existingCompany = await getOneProcedure('sp_GetCustomerCompanyById', [req.params.id]);
    
    if (!existingCompany) {
      return res.status(404).json({ message: 'Customer company not found' });
    }

    // Check if name is being changed and if it conflicts with existing companies
    if (name && name !== existingCompany.name) {
      const nameCheck = await callProcedure('sp_CheckCustomerCompanyNameExists', [name, req.params.id]);
      
      if (nameCheck[0]?.name_count > 0) {
        return res.status(400).json({ message: 'Customer company with this name already exists' });
      }
    }

    // Update customer company using stored procedure
    await callProcedure('sp_UpdateCustomerCompany', [
      req.params.id,
        name,
        industry,
        address,
        contact_email,
        contact_phone
    ]);

    // Get the updated company
    const company = await getOneProcedure('sp_GetCustomerCompanyById', [req.params.id]);
    
    // Get customers count
    const dependencyCheck = await callProcedure('sp_CountCustomerCompanyDependencies', [req.params.id]);
    company.total_customers = dependencyCheck[0]?.count || 0;

    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Error updating customer company:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete customer company
const deleteCustomerCompany = async (req, res) => {
  try {
    // Check if company exists
    const company = await getOneProcedure('sp_GetCustomerCompanyById', [req.params.id]);

    if (!company) {
      return res.status(404).json({ message: 'Customer company not found' });
    }

    // Check if company has dependencies
    const dependencyCheck = await callProcedure('sp_CountCustomerCompanyDependencies', [req.params.id]);
    
    if (dependencyCheck[0]?.count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete customer company with existing customer records' 
      });
    }

    // Delete customer company using stored procedure
    await callProcedure('sp_DeleteCustomerCompany', [req.params.id]);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting customer company:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getCustomerCompanies,
  getCustomerCompany,
  createCustomerCompany,
  updateCustomerCompany,
  deleteCustomerCompany
};
