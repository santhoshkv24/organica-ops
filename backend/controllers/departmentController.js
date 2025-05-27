const { Department } = require('../models');

// Get all departments
const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll();
    res.status(200).json({ success: true, count: departments.length, data: departments });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get department by ID
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    res.status(200).json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get departments by company
const getDepartmentsByCompany = async (req, res) => {
  try {
    const departments = await Department.findAll({
      where: { company_id: req.params.companyId }
    });
    
    res.status(200).json({ success: true, count: departments.length, data: departments });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create department
const createDepartment = async (req, res) => {
  try {
    const department = await Department.create(req.body);
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update department
const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    await department.update(req.body);
    
    res.status(200).json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete department
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    await department.destroy();
    
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllDepartments,
  getDepartmentById,
  getDepartmentsByCompany,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
