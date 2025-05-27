const { CustomerDetails } = require('../models');

// Get all customer details
const getAllCustomerDetails = async (req, res) => {
  try {
    const customerDetails = await CustomerDetails.findAll();
    res.status(200).json({ success: true, count: customerDetails.length, data: customerDetails });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get customer details by ID
const getCustomerDetailsById = async (req, res) => {
  try {
    const customerDetails = await CustomerDetails.findByPk(req.params.id);
    
    if (!customerDetails) {
      return res.status(404).json({ message: 'Customer details not found' });
    }
    
    res.status(200).json({ success: true, data: customerDetails });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get customers by company
const getCustomersByCompany = async (req, res) => {
  try {
    const customers = await CustomerDetails.findAll({
      where: { customer_company_id: req.params.companyId }
    });
    
    res.status(200).json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create customer details
const createCustomerDetails = async (req, res) => {
  try {
    const customerDetails = await CustomerDetails.create(req.body);
    res.status(201).json({ success: true, data: customerDetails });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update customer details
const updateCustomerDetails = async (req, res) => {
  try {
    const customerDetails = await CustomerDetails.findByPk(req.params.id);
    
    if (!customerDetails) {
      return res.status(404).json({ message: 'Customer details not found' });
    }
    
    await customerDetails.update(req.body);
    
    res.status(200).json({ success: true, data: customerDetails });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete customer details
const deleteCustomerDetails = async (req, res) => {
  try {
    const customerDetails = await CustomerDetails.findByPk(req.params.id);
    
    if (!customerDetails) {
      return res.status(404).json({ message: 'Customer details not found' });
    }
    
    await customerDetails.destroy();
    
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllCustomerDetails,
  getCustomerDetailsById,
  getCustomersByCompany,
  createCustomerDetails,
  updateCustomerDetails,
  deleteCustomerDetails
};
