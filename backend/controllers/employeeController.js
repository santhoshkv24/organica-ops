const { query, getOne, insert, update, remove } = require('../utils/dbUtils');

// Get all employees
const getEmployees = async (req, res) => {
  try {
    const employees = await query(`
      SELECT e.*, 
             t.name as team_name,
             d.name as department_name
      FROM employees e
      LEFT JOIN teams t ON e.team_id = t.team_id
      LEFT JOIN departments d ON e.department_id = d.department_id
      ORDER BY e.created_at DESC
    `);
    
    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    console.error('Error getting employees:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single employee
const getEmployee = async (req, res) => {
  try {
    const employee = await getOne(`
      SELECT e.*, 
             t.name as team_name,
             d.name as department_name
      FROM employees e
      LEFT JOIN teams t ON e.team_id = t.team_id
      LEFT JOIN departments d ON e.department_id = d.department_id
      WHERE e.employee_id = ?
    `, [req.params.id]);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error getting employee:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create employee
const createEmployee = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      hire_date,
      team_id,
      department_id,
      position
    } = req.body;

    // Check if team exists
    if (team_id) {
      const team = await getOne(
        'SELECT team_id FROM teams WHERE team_id = ?',
        [team_id]
      );

      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }
    }

    // Check if department exists
    if (department_id) {
      const department = await getOne(
        'SELECT department_id FROM departments WHERE department_id = ?',
        [department_id]
      );

      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }
    }

    // Check if email is unique
    const existingEmployee = await getOne(
      'SELECT employee_id FROM employees WHERE email = ?',
      [email]
    );

    if (existingEmployee) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const employeeId = await insert('employees', {
      first_name,
      last_name,
      email,
      phone,
      hire_date,
      team_id,
      department_id,
      position
    });

    const employee = await getOne(`
      SELECT e.*, 
             t.name as team_name,
             d.name as department_name
      FROM employees e
      LEFT JOIN teams t ON e.team_id = t.team_id
      LEFT JOIN departments d ON e.department_id = d.department_id
      WHERE e.employee_id = ?
    `, [employeeId]);

    res.status(201).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      hire_date,
      team_id,
      department_id,
      position
    } = req.body;

    // Check if team exists
    if (team_id) {
      const team = await getOne(
        'SELECT team_id FROM teams WHERE team_id = ?',
        [team_id]
      );

      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }
    }

    // Check if department exists
    if (department_id) {
      const department = await getOne(
        'SELECT department_id FROM departments WHERE department_id = ?',
        [department_id]
      );

      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }
    }

    // Check if email is unique (excluding current employee)
    if (email) {
      const existingEmployee = await getOne(
        'SELECT employee_id FROM employees WHERE email = ? AND employee_id != ?',
        [email, req.params.id]
      );

      if (existingEmployee) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const result = await update(
      'employees',
      {
        first_name,
        last_name,
        email,
        phone,
        hire_date,
        team_id,
        department_id,
        position
      },
      'employee_id = ?',
      [req.params.id]
    );

    if (result === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const employee = await getOne(`
      SELECT e.*, 
             t.name as team_name,
             d.name as department_name
      FROM employees e
      LEFT JOIN teams t ON e.team_id = t.team_id
      LEFT JOIN departments d ON e.department_id = d.department_id
      WHERE e.employee_id = ?
    `, [req.params.id]);

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    const result = await remove(
      'employees',
      'employee_id = ?',
      [req.params.id]
    );

    if (result === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
