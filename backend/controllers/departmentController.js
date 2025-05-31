const { query, getOne, insert, update, remove } = require('../utils/dbUtils');

// Get all departments
const getDepartments = async (req, res) => {
  try {
    const departments = await query(`
      SELECT d.*, c.name as company_name 
      FROM departments d
      LEFT JOIN companies c ON d.company_id = c.company_id
      ORDER BY d.created_at DESC
    `);
    
    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error) {
    console.error('Error getting departments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single department
const getDepartment = async (req, res) => {
  try {
    const department = await getOne(`
      SELECT d.*, c.name as company_name 
      FROM departments d
      LEFT JOIN companies c ON d.company_id = c.company_id
      WHERE d.department_id = ?
    `, [req.params.id]);

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Error getting department:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create department
const createDepartment = async (req, res) => {
  try {
    const { name, company_id, description } = req.body;

    // Check if company exists
    if (company_id) {
      const company = await getOne(
        'SELECT company_id FROM companies WHERE company_id = ?',
        [company_id]
      );

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }
    }

    const departmentId = await insert('departments', {
      name,
      company_id,
      description
    });

    const department = await getOne(`
      SELECT d.*, c.name as company_name 
      FROM departments d
      LEFT JOIN companies c ON d.company_id = c.company_id
      WHERE d.department_id = ?
    `, [departmentId]);

    res.status(201).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update department
const updateDepartment = async (req, res) => {
  try {
    const { name, company_id, description } = req.body;

    // Check if company exists if company_id is provided
    if (company_id) {
      const company = await getOne(
        'SELECT company_id FROM companies WHERE company_id = ?',
        [company_id]
      );

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }
    }

    const result = await update(
      'departments',
      {
        name,
        company_id,
        description
      },
      'department_id = ?',
      [req.params.id]
    );

    if (result === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const department = await getOne(`
      SELECT d.*, c.name as company_name 
      FROM departments d
      LEFT JOIN companies c ON d.company_id = c.company_id
      WHERE d.department_id = ?
    `, [req.params.id]);

    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete department
const deleteDepartment = async (req, res) => {
  try {
    const result = await remove(
      'departments',
      'department_id = ?',
      [req.params.id]
    );

    if (result === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
