const { query, callProcedure, beginTransaction, commit, rollback } = require('../utils/dbUtils');

// Get all projects
const getProjects = async (req, res) => {
  try {
    const projects = await callProcedure('sp_GetAllProjects', []);
    
    // For each project, get team members
    const projectsWithTeamMembers = await Promise.all(
      projects.map(async (project) => {
        const [_, teamMembers] = await callProcedure('sp_GetProjectById', [project.project_id]);
        return {
          ...project,
          team_members: teamMembers || []
        };
      })
    );
    
    res.status(200).json({
      success: true,
      count: projectsWithTeamMembers.length,
      data: projectsWithTeamMembers
    });
  } catch (error) {
    console.error('Error getting projects:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get projects',
      error: error.message 
    });
  }
};

// Get single project
const getProject = async (req, res) => {
  try {
    // sp_GetProjectById returns multiple result sets
    const [project, teamMembers] = await callProcedure('sp_GetProjectById', [req.params.id]);
    
    if (!project || project.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        ...project[0],
        team_members: teamMembers || []
      }
    });
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get project',
      error: error.message 
    });
  }
};

// Create project
const createProject = async (req, res) => {
  let connection;
  try {
    connection = await beginTransaction();
    
    const {
      name,
      customer_company_id,
      description = '',
      status = 'Planned',
      start_date,
      end_date,
      project_manager_id,
      budget = null
    } = req.body;

    // Check if customer company exists
    if (customer_company_id) {
      const [company] = await callProcedure('sp_GetCustomerCompanyById', [customer_company_id]);
      if (!company) {
        return res.status(404).json({ 
          success: false,
          message: 'Customer company not found' 
        });
      }
    }

    // Check if project manager exists and is a manager
    if (project_manager_id) {
      const [manager] = await callProcedure('sp_GetEmployeeById', [project_manager_id]);
      if (!manager) {
        return res.status(404).json({ 
          success: false,
          message: 'Project manager not found' 
        });
      }
      
      // Check if the employee is a manager (has manager role)
      const [user] = await callProcedure('sp_GetUserByEmployeeId', [project_manager_id]);
      if (!user || user.role !== 'manager') {
        return res.status(400).json({ 
          success: false,
          message: 'Selected employee is not a manager' 
        });
      }
    }

    // Create project using stored procedure
    const [project] = await callProcedure('sp_CreateProject', [
      name,
      customer_company_id || null,
      project_manager_id || null,
      description,
      status,
      start_date,
      end_date,
      budget
    ], connection);

    if (!project || !project.project_id) {
      throw new Error('Failed to create project');
    }

    await commit(connection);

    // Get the created project with its team members
    const [createdProject, teamMembers] = await callProcedure('sp_GetProjectById', [project.project_id]);
    
    res.status(201).json({
      success: true,
      data: {
        ...createdProject[0],
        team_members: teamMembers || []
      }
    });
  } catch (error) {
    if (connection) await rollback(connection);
    console.error('Error creating project:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create project',
      error: error.message 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Update project
const updateProject = async (req, res) => {
  let connection;
  try {
    connection = await beginTransaction();
    
    const { id: projectId } = req.params;
    const {
      name,
      customer_company_id,
      description,
      status,
      start_date,
      end_date,
      project_manager_id,
      budget = null
    } = req.body;

    // Check if project exists
    const [existingProject] = await callProcedure('sp_GetProjectById', [projectId]);
    if (!existingProject || existingProject.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    // Check if customer company exists if provided
    if (customer_company_id) {
      const [company] = await callProcedure('sp_GetCustomerCompanyById', [customer_company_id]);
      if (!company) {
        return res.status(404).json({ 
          success: false,
          message: 'Customer company not found' 
        });
      }
    }

    // Check if project manager exists and is a manager if provided
    if (project_manager_id) {
      const [manager] = await callProcedure('sp_GetEmployeeById', [project_manager_id]);
      if (!manager) {
        return res.status(404).json({ 
          success: false,
          message: 'Project manager not found' 
        });
      }
      
      // Check if the employee is a manager (has manager role)
      const [user] = await callProcedure('sp_GetUserByEmployeeId', [project_manager_id]);
      if (!user || user.role !== 'manager') {
        return res.status(400).json({ 
          success: false,
          message: 'Selected employee is not a manager' 
        });
      }
    }

    // Update project using stored procedure
    await callProcedure('sp_UpdateProject', [
      projectId,
      name,
      customer_company_id || null,
      project_manager_id || null,
      description || '',
      status,
      start_date,
      end_date,
      budget
    ], connection);

    await commit(connection);

    // Get the updated project with its team members
    const [updatedProject, teamMembers] = await callProcedure('sp_GetProjectById', [projectId]);
    
    res.status(200).json({
      success: true,
      data: {
        ...updatedProject[0],
        team_members: teamMembers || []
      }
    });
  } catch (error) {
    if (connection) await rollback(connection);
    console.error('Error updating project:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update project',
      error: error.message 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Delete project
const deleteProject = async (req, res) => {
  let connection;
  try {
    connection = await beginTransaction();
    
    const { id: projectId } = req.params;
    
    // Check if project exists
    const [project] = await callProcedure('sp_GetProjectById', [projectId]);
    if (!project || project.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    // Delete project (the stored procedure will handle cascading deletes)
    await callProcedure('sp_DeleteProject', [projectId], connection);
    
    await commit(connection);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    if (connection) await rollback(connection);
    console.error('Error deleting project:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete project',
      error: error.message 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Get projects by team
const getProjectsByTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    // Check if team exists
    const [team] = await callProcedure('sp_GetTeamById', [teamId]);
    if (!team) {
      return res.status(404).json({ 
        success: false,
        message: 'Team not found' 
      });
    }
    
    // Get team members
    const teamMembers = await callProcedure('sp_GetTeamMembers', [teamId]);
    if (!teamMembers || teamMembers.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }
    
    // Get unique project IDs from team members
    const projectIds = [...new Set(teamMembers.map(member => member.project_id))];
    
    // Get full project details for each project
    const projects = await Promise.all(
      projectIds.map(async (id) => {
        const [project, teamMembers] = await callProcedure('sp_GetProjectById', [id]);
        return project && project[0] ? {
          ...project[0],
          team_members: teamMembers || []
        } : null;
      })
    );
    
    // Filter out any null projects
    const validProjects = projects.filter(p => p !== null);
    
    res.status(200).json({
      success: true,
      count: validProjects.length,
      data: validProjects
    });
  } catch (error) {
    console.error('Error getting projects by team:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get projects by team',
      error: error.message 
    });
  }
};

// Get projects by manager
const getProjectsByManager = async (req, res) => {
  try {
    const projects = await callProcedure('sp_GetProjectsByManager', [req.params.managerId]);
    
    // For each project, get its team members
    const projectsWithTeamMembers = await Promise.all(projects.map(async (project) => {
      const [_, teamMembers] = await callProcedure('sp_GetProjectById', [project.project_id]);
      return {
        ...project,
        team_members: teamMembers || []
      };
    }));
    
    res.status(200).json({
      success: true,
      count: projectsWithTeamMembers.length,
      data: projectsWithTeamMembers
    });
  } catch (error) {
    console.error('Error getting manager projects:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get manager projects',
      error: error.message 
    });
  }
};

// Get projects by team member
const getProjectsByTeamMember = async (req, res) => {
  try {
    const projects = await callProcedure('sp_GetProjectsByTeamMember', [req.params.employeeId]);
    
    // For each project, get its team members
    const projectsWithTeamMembers = await Promise.all(projects.map(async (project) => {
      const [_, teamMembers] = await callProcedure('sp_GetProjectById', [project.project_id]);
      return {
        ...project,
        team_members: teamMembers || []
      };
    }));
    
    res.status(200).json({
      success: true,
      count: projectsWithTeamMembers.length,
      data: projectsWithTeamMembers
    });
  } catch (error) {
    console.error('Error getting projects by team member:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get projects by team member',
      error: error.message 
    });
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectsByTeam,
  getProjectsByManager,
  getProjectsByTeamMember
};