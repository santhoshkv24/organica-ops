const { query, getOne, insert, update, remove } = require('../utils/dbUtils');

// Get all teams
const getTeams = async (req, res) => {
  try {
    const teams = await query(`
      SELECT t.*, d.name as department_name 
      FROM teams t
      LEFT JOIN departments d ON t.department_id = d.department_id
      ORDER BY t.created_at DESC
    `);
    
    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    console.error('Error getting teams:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single team
const getTeam = async (req, res) => {
  try {
    const team = await getOne(`
      SELECT t.*, d.name as department_name 
      FROM teams t
      LEFT JOIN departments d ON t.department_id = d.department_id
      WHERE t.team_id = ?
    `, [req.params.id]);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Error getting team:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create team
const createTeam = async (req, res) => {
  try {
    const { name, department_id, description } = req.body;

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

    const teamId = await insert('teams', {
      name,
      department_id,
      description
    });

    const team = await getOne(`
      SELECT t.*, d.name as department_name 
      FROM teams t
      LEFT JOIN departments d ON t.department_id = d.department_id
      WHERE t.team_id = ?
    `, [teamId]);

    res.status(201).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update team
const updateTeam = async (req, res) => {
  try {
    const { name, department_id, description } = req.body;

    // Check if department exists if department_id is provided
    if (department_id) {
      const department = await getOne(
        'SELECT department_id FROM departments WHERE department_id = ?',
        [department_id]
      );

      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }
    }

    const result = await update(
      'teams',
      {
        name,
        department_id,
        description
      },
      'team_id = ?',
      [req.params.id]
    );

    if (result === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const team = await getOne(`
      SELECT t.*, d.name as department_name 
      FROM teams t
      LEFT JOIN departments d ON t.department_id = d.department_id
      WHERE t.team_id = ?
    `, [req.params.id]);

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete team
const deleteTeam = async (req, res) => {
  try {
    const result = await remove(
      'teams',
      'team_id = ?',
      [req.params.id]
    );

    if (result === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam
};
