const { query, getOne, insert, update, remove } = require('../utils/dbUtils');

// Get all customers
const getCustomers = async (req, res) => {
  try {
    const customers = await query(`
      SELECT cd.*, 
             cc.name as company_name,
             cc.industry as company_industry
      FROM customer_details cd
      LEFT JOIN customer_companies cc ON cd.customer_company_id = cc.customer_company_id
      ORDER BY cd.created_at DESC
    `);
    
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
    const customer = await getOne(`
      SELECT cd.*, 
             cc.name as company_name,
             cc.industry as company_industry
      FROM customer_details cd
      LEFT JOIN customer_companies cc ON cd.customer_company_id = cc.customer_company_id
      WHERE cd.customer_id = ?
    `, [req.params.id]);

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
      const company = await getOne(
        'SELECT customer_company_id FROM customer_companies WHERE customer_company_id = ?',
        [customer_company_id]
      );

      if (!company) {
        return res.status(404).json({ message: 'Customer company not found' });
      }
    }

    // Check if email is unique
    const existingCustomer = await getOne(
      'SELECT customer_id FROM customer_details WHERE email = ?',
      [email]
    );

    if (existingCustomer) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const customerId = await insert('customer_details', {
      customer_company_id,
      first_name,
      last_name,
      email,
      phone,
      position
    });

    const customer = await getOne(`
      SELECT cd.*, 
             cc.name as company_name,
             cc.industry as company_industry
      FROM customer_details cd
      LEFT JOIN customer_companies cc ON cd.customer_company_id = cc.customer_company_id
      WHERE cd.customer_id = ?
    `, [customerId]);

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

    // Check if company exists
    if (customer_company_id) {
      const company = await getOne(
        'SELECT customer_company_id FROM customer_companies WHERE customer_company_id = ?',
        [customer_company_id]
      );

      if (!company) {
        return res.status(404).json({ message: 'Customer company not found' });
      }
    }

    // Check if email is unique (excluding current customer)
    if (email) {
      const existingCustomer = await getOne(
        'SELECT customer_id FROM customer_details WHERE email = ? AND customer_id != ?',
        [email, req.params.id]
      );

      if (existingCustomer) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const result = await update(
      'customer_details',
      {
        customer_company_id,
        first_name,
        last_name,
        email,
        phone,
        position
      },
      'customer_id = ?',
      [req.params.id]
    );

    if (result === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const customer = await getOne(`
      SELECT cd.*, 
             cc.name as company_name,
             cc.industry as company_industry
      FROM customer_details cd
      LEFT JOIN customer_companies cc ON cd.customer_company_id = cc.customer_company_id
      WHERE cd.customer_id = ?
    `, [req.params.id]);

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
    const result = await remove(
      'customer_details',
      'customer_id = ?',
      [req.params.id]
    );

    if (result === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

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
