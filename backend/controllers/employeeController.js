const { Employee } = require('../models');

// Get all employees
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll();
    res.status(200).json({ success: true, count: employees.length, data: employees });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get employees by department
const getEmployeesByDepartment = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      where: { department_id: req.params.departmentId }
    });
    
    res.status(200).json({ success: true, count: employees.length, data: employees });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get employees by team
const getEmployeesByTeam = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      where: { team_id: req.params.teamId }
    });
    
    res.status(200).json({ success: true, count: employees.length, data: employees });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get employees by company
const getEmployeesByCompany = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      where: { company_id: req.params.companyId }
    });
    
    res.status(200).json({ success: true, count: employees.length, data: employees });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create employee
const createEmployee = async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    await employee.update(req.body);
    
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    await employee.destroy();
    
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  getEmployeesByDepartment,
  getEmployeesByTeam,
  getEmployeesByCompany,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
