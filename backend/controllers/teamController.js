const { callProcedure, getOneProcedure } = require('../utils/dbUtils');
const { pool } = require('../config/database');

// Get all teams
const getTeams = async (req, res) => {
  try {
    const teams = await callProcedure('sp_GetAllTeams', []);
    
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
    const team = await getOneProcedure('sp_GetTeamById', [req.params.id]);

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
    const { name, branch_id, description } = req.body;

    if (!branch_id) {
      return res.status(400).json({ message: 'Branch ID is required' });
    }

    const branchIdInt = parseInt(branch_id);
    if (isNaN(branchIdInt)) {
      return res.status(400).json({ message: 'Invalid branch ID format' });
    }

    // Check if branch exists
    const branch = await getOneProcedure('sp_GetBranchById', [branchIdInt]);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Check if team name already exists in this branch
    const nameCheck = await callProcedure('sp_CheckTeamNameExists', [name, branchIdInt, 0]);
    
    if (nameCheck[0]?.name_count > 0) {
      return res.status(400).json({ message: 'Team with this name already exists in this branch' });
    }

    // Create team
    const result = await callProcedure('sp_CreateTeam', [name, branchIdInt, description]);
    
    const teamId = result[0]?.team_id;

    // Get the created team
    const team = await getOneProcedure('sp_GetTeamById', [teamId]);

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
    const { name, branch_id, description } = req.body;
    const teamId = parseInt(req.params.id);

    if (isNaN(teamId)) {
      return res.status(400).json({ message: 'Invalid team ID' });
    }

    if (!branch_id) {
      return res.status(400).json({ message: 'Branch ID is required' });
    }

    const branchIdInt = parseInt(branch_id);
    if (isNaN(branchIdInt)) {
      return res.status(400).json({ message: 'Invalid branch ID format' });
    }

    // Check if team exists
    const team = await getOneProcedure('sp_GetTeamById', [teamId]);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if branch exists
    const branch = await getOneProcedure('sp_GetBranchById', [branchIdInt]);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Check if team name already exists in this branch (excluding current team)
    if (name) {
      const nameCheck = await callProcedure('sp_CheckTeamNameExists', [name, branchIdInt, teamId]);
      
      if (nameCheck[0]?.name_count > 0) {
        return res.status(400).json({ message: 'Team with this name already exists in this branch' });
      }
    }

    // Update team
    await callProcedure('sp_UpdateTeam', [
      teamId,
      name,
      branchIdInt,
      description
    ]);

    // Get updated team
    const updatedTeam = await getOneProcedure('sp_GetTeamById', [teamId]);

    res.status(200).json({
      success: true,
      data: updatedTeam
    });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete team
const deleteTeam = async (req, res) => {
  try {
    // Check if team exists
    const team = await getOneProcedure('sp_GetTeamById', [req.params.id]);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check for dependencies
    const dependencies = await callProcedure('sp_CountTeamDependencies', [req.params.id]);
    
    if (dependencies[0]?.count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete team with existing employees. Remove or reassign these first.'
      });
    }

    // Delete team
    const result = await callProcedure('sp_DeleteTeam', [req.params.id]);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get teams by branch
const getTeamsByBranch = async (req, res) => {
  try {
    const teams = await callProcedure('sp_GetTeamsByBranch', [req.params.branchId]);
    
    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    console.error('Error getting branch teams:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Team Lead Management
const assignTeamLead = async (req, res) => {
  try {
    const { employee_id } = req.body;
    const team_id = parseInt(req.params.teamId);
    const assigned_by = req.user.employee_id;

    // Input validation
    if (!employee_id) {
      return res.status(400).json({ 
        success: false,
        message: 'Employee ID is required' 
      });
    }

    if (isNaN(team_id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid team ID' 
      });
    }

    // Check if user is authorized (admin/manager)
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to assign team leads' 
      });
    }

    // Check if team exists
    const team = await getOneProcedure('sp_GetTeamById', [team_id]);
    if (!team) {
      return res.status(404).json({ 
        success: false,
        message: 'Team not found' 
      });
    }

    // Log the action
    console.log(`User ${req.user.user_id} is assigning employee ${employee_id} as team lead for team ${team_id}`);

    // Assign team lead
    const result = await callProcedure('sp_AssignTeamLead', [
      employee_id,
      team_id,
      assigned_by
    ]);

    // Get the updated team with leads
    const updatedTeam = await getOneProcedure('sp_GetTeamById', [team_id]);
    const teamLeads = await callProcedure('sp_GetTeamLeadsByTeam', [team_id]);

    res.status(201).json({
      success: true,
      data: {
        ...updatedTeam,
        team_leads: teamLeads
      }
    });
  } catch (error) {
    console.error('Error assigning team lead:', error);
    
    let statusCode = 500;
    let errorMessage = 'Server error';
    
    if (error.message.includes('already a team lead')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('not a member of this team')) {
      statusCode = 400;
      errorMessage = error.message;
    }
    
    res.status(statusCode).json({ 
      success: false,
      message: errorMessage,
      error: error.message 
    });
  }
};

const getTeamLeads = async (req, res) => {
  try {
    const team_id = parseInt(req.params.teamId);
    
    // Input validation
    if (isNaN(team_id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid team ID' 
      });
    }

    // Check if team exists
    const team = await getOneProcedure('sp_GetTeamById', [team_id]);
    if (!team) {
      return res.status(404).json({ 
        success: false,
        message: 'Team not found' 
      });
    }

    // Check if user is authorized (admin/manager or team member)
    const isTeamMember = req.user.role === 'employee' || req.user.role === 'team_lead';
    if (isTeamMember && !(await isUserInTeam(req.user.employee_id, team_id))) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to view team leads for this team' 
      });
    }

    // Get team leads
    const teamLeads = await callProcedure('sp_GetTeamLeadsByTeam', [team_id]);

    res.status(200).json({
      success: true,
      count: teamLeads.length,
      data: teamLeads
    });
  } catch (error) {
    console.error('Error getting team leads:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Helper function to check if a user is in a specific team
async function isUserInTeam(employeeId, teamId) {
  try {
    const result = await callProcedure('sp_GetEmployeeById', [employeeId]);
    const employee = result[0];
    return employee && employee.team_id === teamId;
  } catch (error) {
    console.error('Error checking team membership:', error);
    return false;
  }
}

const removeTeamLead = async (req, res) => {
  try {
    const team_lead_id = parseInt(req.params.teamLeadId);
    
    if (isNaN(team_lead_id)) {
      return res.status(400).json({ message: 'Invalid team lead ID' });
    }

    // Check if the current user is authorized (admin/manager)
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to remove team leads' 
      });
    }

    // Log the action
    console.log(`User ${req.user.user_id} is removing team lead with ID: ${team_lead_id}`);

    // Remove team lead
    const result = await callProcedure('sp_RemoveTeamLead', [team_lead_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Team lead assignment not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error removing team lead:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get teams where user is a team lead
const getMyTeamLeads = async (req, res) => {
  try {
    const employee_id = req.user.employee_id;
    
    if (!employee_id) {
      return res.status(400).json({ 
        success: false,
        message: 'Employee ID not found in user profile' 
      });
    }

    const teams = await callProcedure('sp_GetTeamLeadTeams', [employee_id]);
    
    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    console.error('Error getting team lead teams:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Helper function to call a stored procedure and get all result sets
const callProcedureWithMultipleResultSets = async (procedureName, params = []) => {
  let connection = null;
  try {
    connection = await pool.getConnection();
    
    // Format the procedure call with the correct number of parameters
    const placeholders = params.map(() => '?').join(', ');
    const sql = `CALL ${procedureName}(${placeholders})`;
    
    const [results] = await connection.execute(sql, params);
    // Return all result sets as they are
    return results;
  } catch (error) {
    console.error('Multi-result procedure call error:', {
      procedureName,
      params,
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Get team lead status for a user
const getTeamLeadStatus = async (req, res) => {
  try {
    const employee_id = parseInt(req.params.employeeId);
    
    if (isNaN(employee_id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid employee ID' 
      });
    }
    
    // Only allow admins/managers or the user themselves to check status
    if (req.user.role !== 'admin' && 
        req.user.role !== 'manager' && 
        req.user.employee_id !== employee_id) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to view this information' 
      });
    }
    
    // Get the teams the employee leads and their associated projects
    const allResults = await callProcedureWithMultipleResultSets('sp_GetTeamLeadTeams', [employee_id]);
    
    console.log('Raw results from sp_GetTeamLeadTeams:', JSON.stringify(allResults, null, 2));
    
    // The results should be multiple arrays, each representing a result set
    const leadTeams = Array.isArray(allResults) && allResults.length > 0 ? allResults[0] : [];
    const projectsData = Array.isArray(allResults) && allResults.length > 1 ? allResults[1] : [];
    
    console.log('Lead teams:', leadTeams);
    console.log('Projects data:', projectsData);
    
    // Create a map of team_id to projects
    const teamProjects = {};
    
    if (Array.isArray(projectsData)) {
      projectsData.forEach(project => {
        if (!teamProjects[project.team_id]) {
          teamProjects[project.team_id] = [];
        }
        
        // Check for duplicate projects
        const existingProject = teamProjects[project.team_id].find(
          p => p.project_id === project.project_id
        );
        
        if (!existingProject) {
          teamProjects[project.team_id].push({
            project_id: project.project_id,
            name: project.project_name,
            description: project.description,
            status: project.status,
            start_date: project.start_date,
            end_date: project.end_date
          });
        }
      });
    }
    
    // Enhance teams with their associated projects
    const enhancedTeams = Array.isArray(leadTeams) ? leadTeams.map(team => {
      return {
        ...team,
        projects: teamProjects[team.team_id] || []
      };
    }) : [];
    
    res.status(200).json({
      success: true,
      data: {
        is_team_lead: enhancedTeams.length > 0,
        teams: enhancedTeams
      }
    });
  } catch (error) {
    console.error('Error getting team lead status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get team members (employees in a team)
const getTeamMembers = async (req, res) => {
  try {
    const team_id = parseInt(req.params.teamId);
    
    // Input validation
    if (isNaN(team_id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid team ID' 
      });
    }

    // Check if team exists
    const team = await getOneProcedure('sp_GetTeamById', [team_id]);
    if (!team) {
      return res.status(404).json({ 
        success: false,
        message: 'Team not found' 
      });
    }

    // Check if user is authorized (admin/manager or team member/lead)
    const isTeamMember = req.user.role === 'employee' || req.user.role === 'team_lead';
    if (isTeamMember && !(await isUserInTeam(req.user.employee_id, team_id))) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to view members of this team' 
      });
    }

    // Get team members (employees in the team)
    const members = await callProcedure('sp_GetEmployeesByTeam', [team_id]);
    
    // Get team leads to mark them in the response
    const teamLeads = await callProcedure('sp_GetTeamLeadsByTeam', [team_id]);
    const leadIds = new Set(teamLeads.map(tl => tl.employee_id));

    // Process members - add is_team_lead flag and filter sensitive data if needed
    const processedMembers = members.map(member => {
      // Create a sanitized member object
      const sanitizedMember = { ...member };
      
      // Add is_team_lead flag
      sanitizedMember.is_team_lead = leadIds.has(member.employee_id);
      
      // For team leads viewing other members, remove sensitive data
      if (req.user.role === 'team_lead' && member.employee_id !== req.user.employee_id) {
        const { password_hash, ...safeMember } = sanitizedMember;
        return safeMember;
      }
      
      return sanitizedMember;
    });

    res.status(200).json({
      success: true,
      count: processedMembers.length,
      data: processedMembers
    });
  } catch (error) {
    console.error('Error getting team members:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

module.exports = {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamsByBranch,
  assignTeamLead,
  getTeamLeads,
  removeTeamLead,
  getMyTeamLeads,
  getTeamMembers,
  getTeamLeadStatus
};
