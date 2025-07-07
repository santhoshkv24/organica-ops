const { callProcedure, getOneProcedure } = require('../utils/dbUtils');

// Add a member to a project team
const addProjectTeamMember = async (req, res) => {
  try {
    const { project_id, employee_id, role } = req.body;
    const added_by = req.user.employee_id; // Get the ID of the authenticated user

    console.log(project_id, employee_id, role, added_by);
    const result = await callProcedure('sp_CreateProjectTeamMember', [
      project_id, 
      employee_id,
      role,
      added_by
    ]);
    
    res.status(201).json({
      success: true,
      data: result[0],
      message: 'Team member added to project successfully'
    });
  } catch (error) {
    console.error('Error adding project team member:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add project team member'
    });
  }
};

// Update a project team member's role
const updateProjectTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    const result = await callProcedure('sp_UpdateProjectTeamMember', [id, role]);
    
    res.status(200).json({
      success: true,
      data: result[0],
      message: 'Team member role updated successfully'
    });
  } catch (error) {
    console.error('Error updating project team member:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update project team member'
    });
  }
};

// Remove a member from a project team
const removeProjectTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await callProcedure('sp_DeleteProjectTeamMember', [id]);
    
    if (result[0].deleted_rows === 0) {
      return res.status(404).json({
        success: false,
        message: 'No project team member found with the given ID'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Team member removed from project successfully'
    });
  } catch (error) {
    console.error('Error removing project team member:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove project team member'
    });
  }
};

// Get all members of a project team
const getProjectTeamMembers = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const members = await callProcedure('sp_GetProjectTeamMembers', [projectId]);
    
    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    console.error('Error getting project team members:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get project team members'
    });
  }
};

// Get all projects for an employee
const getEmployeeProjects = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const projects = await callProcedure('sp_GetEmployeeProjects', [employeeId]);
    
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Error getting employee projects:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get employee projects'
    });
  }
};

// Get team members by role
const getProjectTeamMembersByRole = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { role } = req.query;
    
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role parameter is required'
      });
    }
    
    const members = await callProcedure('sp_GetProjectTeamMembersByRole', [projectId, role]);
    
    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    console.error('Error getting project team members by role:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get project team members by role'
    });
  }
};

// Get projects for the current user
const getMyProjects = async (req, res) => {
  try {
    if (!req.user || !req.user.employee_id) {
      return res.status(400).json({
        success: false,
        message: 'User authentication failed',
        details: 'Employee ID is missing'
      });
    }
    
    const employeeId = req.user.employee_id;
    const role = req.user.role;
    
    // Different handling based on user role
    let projects = [];
    
    if (role === 'admin') {
      // Admins can see all projects
      projects = await callProcedure('sp_GetAllProjects', []);
    } else if (role === 'manager') {
      // Project managers see projects they manage
      projects = await callProcedure('sp_GetProjectsByManager', [employeeId]);
    } else if (role === 'team_lead') {
      // Team leads see projects for their teams
      projects = await callProcedure('sp_GetTeamLeadProjects', [employeeId]);
    } else {
      // Regular employees see projects they're assigned to
      projects = await callProcedure('sp_GetEmployeeProjects', [employeeId]);
    }
    
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Error getting user projects:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user projects'
    });
  }
};

module.exports = {
  addProjectTeamMember,
  updateProjectTeamMember,
  removeProjectTeamMember,
  getProjectTeamMembers,
  getEmployeeProjects,
  getProjectTeamMembersByRole,
  getMyProjects
}; 