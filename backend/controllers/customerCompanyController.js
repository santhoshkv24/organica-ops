const { CustomerCompany } = require('../models');

// Get all customer companies
const getAllCustomerCompanies = async (req, res) => {
  try {
    const customerCompanies = await CustomerCompany.findAll();
    res.status(200).json({ success: true, count: customerCompanies.length, data: customerCompanies });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get customer company by ID
const getCustomerCompanyById = async (req, res) => {
  try {
    const customerCompany = await CustomerCompany.findByPk(req.params.id);
    
    if (!customerCompany) {
      return res.status(404).json({ message: 'Customer company not found' });
    }
    
    res.status(200).json({ success: true, data: customerCompany });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create customer company
const createCustomerCompany = async (req, res) => {
  try {
    const customerCompany = await CustomerCompany.create(req.body);
    res.status(201).json({ success: true, data: customerCompany });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update customer company
const updateCustomerCompany = async (req, res) => {
  try {
    const customerCompany = await CustomerCompany.findByPk(req.params.id);
    
    if (!customerCompany) {
      return res.status(404).json({ message: 'Customer company not found' });
    }
    
    await customerCompany.update(req.body);
    
    res.status(200).json({ success: true, data: customerCompany });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete customer company
const deleteCustomerCompany = async (req, res) => {
  try {
    const customerCompany = await CustomerCompany.findByPk(req.params.id);
    
    if (!customerCompany) {
      return res.status(404).json({ message: 'Customer company not found' });
    }
    
    await customerCompany.destroy();
    
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllCustomerCompanies,
  getCustomerCompanyById,
  createCustomerCompany,
  updateCustomerCompany,
  deleteCustomerCompany
};
