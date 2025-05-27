const { Team } = require('../models');

// Get all teams
const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.findAll();
    res.status(200).json({ success: true, count: teams.length, data: teams });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get team by ID
const getTeamById = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get teams by department
const getTeamsByDepartment = async (req, res) => {
  try {
    const teams = await Team.findAll({
      where: { department_id: req.params.departmentId }
    });
    
    res.status(200).json({ success: true, count: teams.length, data: teams });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get teams by company
const getTeamsByCompany = async (req, res) => {
  try {
    const teams = await Team.findAll({
      where: { company_id: req.params.companyId }
    });
    
    res.status(200).json({ success: true, count: teams.length, data: teams });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create team
const createTeam = async (req, res) => {
  try {
    const team = await Team.create(req.body);
    res.status(201).json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update team
const updateTeam = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    await team.update(req.body);
    
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete team
const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    await team.destroy();
    
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllTeams,
  getTeamById,
  getTeamsByDepartment,
  getTeamsByCompany,
  createTeam,
  updateTeam,
  deleteTeam
};
