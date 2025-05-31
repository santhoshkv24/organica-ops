const { query, getOne, insert, update, remove } = require('../utils/dbUtils');

// Get all customer companies
const getCustomerCompanies = async (req, res) => {
  try {
    const companies = await query(`
      SELECT cc.*,
             COUNT(cd.customer_id) as total_customers
      FROM customer_companies cc
      LEFT JOIN customer_details cd ON cc.customer_company_id = cd.customer_company_id
      GROUP BY cc.customer_company_id
      ORDER BY cc.created_at DESC
    `);
    
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
    const company = await getOne(`
      SELECT cc.*,
             COUNT(cd.customer_id) as total_customers
      FROM customer_companies cc
      LEFT JOIN customer_details cd ON cc.customer_company_id = cd.customer_company_id
      WHERE cc.customer_company_id = ?
      GROUP BY cc.customer_company_id
    `, [req.params.id]);

    if (!company) {
      return res.status(404).json({ message: 'Customer company not found' });
    }

    // Get customers of this company
    const customers = await query(`
      SELECT * FROM customer_details
      WHERE customer_company_id = ?
      ORDER BY created_at DESC
    `, [req.params.id]);

    company.customers = customers;

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

    const companyId = await insert('customer_companies', {
      name,
      industry,
      address,
      contact_email,
      contact_phone
    });

    const company = await getOne(`
      SELECT cc.*,
             COUNT(cd.customer_id) as total_customers
      FROM customer_companies cc
      LEFT JOIN customer_details cd ON cc.customer_company_id = cd.customer_company_id
      WHERE cc.customer_company_id = ?
      GROUP BY cc.customer_company_id
    `, [companyId]);

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

    const result = await update(
      'customer_companies',
      {
        name,
        industry,
        address,
        contact_email,
        contact_phone
      },
      'customer_company_id = ?',
      [req.params.id]
    );

    if (result === 0) {
      return res.status(404).json({ message: 'Customer company not found' });
    }

    const company = await getOne(`
      SELECT cc.*,
             COUNT(cd.customer_id) as total_customers
      FROM customer_companies cc
      LEFT JOIN customer_details cd ON cc.customer_company_id = cd.customer_company_id
      WHERE cc.customer_company_id = ?
      GROUP BY cc.customer_company_id
    `, [req.params.id]);

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
    const result = await remove(
      'customer_companies',
      'customer_company_id = ?',
      [req.params.id]
    );

    if (result === 0) {
      return res.status(404).json({ message: 'Customer company not found' });
    }

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
