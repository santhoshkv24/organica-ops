const { query, getOne, insert, update, remove } = require('../utils/dbUtils');

// Get all companies
const getCompanies = async (req, res) => {
  try {
    const companies = await query(
      'SELECT * FROM companies ORDER BY created_at DESC'
    );
    
    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error) {
    console.error('Error getting companies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single company
const getCompany = async (req, res) => {
  try {
    const company = await getOne(
      'SELECT * FROM companies WHERE company_id = ?',
      [req.params.id]
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Error getting company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create company
const createCompany = async (req, res) => {
  try {
    // Check if company with same name exists
    const existingCompany = await getOne(
      'SELECT * FROM companies WHERE name = ?',
      [req.body.name]
    );

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company with this name already exists'
      });
    }

    const { name, address, contact_email, contact_phone } = req.body;

    const companyId = await insert('companies', {
      name,
      address,
      contact_email,
      contact_phone
    });

    const company = await getOne(
      'SELECT * FROM companies WHERE company_id = ?',
      [companyId]
    );

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: company
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create company',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update company
const updateCompany = async (req, res) => {
  try {
    // Check if company exists
    const existingCompany = await getOne(
      'SELECT * FROM companies WHERE company_id = ?',
      [req.params.id]
    );

    if (!existingCompany) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if name is being changed and if new name already exists
    if (req.body.name && req.body.name !== existingCompany.name) {
      const nameExists = await getOne(
        'SELECT * FROM companies WHERE name = ? AND company_id != ?',
        [req.body.name, req.params.id]
      );

      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: 'Company with this name already exists'
        });
      }
    }

    const { name, address, contact_email, contact_phone } = req.body;

    await update(
      'companies',
      {
        name,
        address,
        contact_email,
        contact_phone
      },
      'company_id = ?',
      [req.params.id]
    );

    const updatedCompany = await getOne(
      'SELECT * FROM companies WHERE company_id = ?',
      [req.params.id]
    );

    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: updatedCompany
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete company
const deleteCompany = async (req, res) => {
  try {
    // Check if company exists
    const company = await getOne(
      'SELECT * FROM companies WHERE company_id = ?',
      [req.params.id]
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if company has related records
    const [departments] = await query(
      'SELECT COUNT(*) as count FROM departments WHERE company_id = ?',
      [req.params.id]
    );

    if (departments.count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete company with existing departments'
      });
    }

    await remove(
      'companies',
      'company_id = ?',
      [req.params.id]
    );

    res.status(200).json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete company',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany
};
