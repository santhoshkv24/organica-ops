const { callProcedure } = require('../utils/dbUtils');

// Get project ID by customer head ID
const getProjectIdByCustomerHeadId = async (req, res) => {
  try {
    const { customerHeadId } = req.params;
    const result = await callProcedure('sp_GetProjectIDByCustomerHeadId', [customerHeadId]);
    
    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No project found for this customer head'
      });
    }
    
    res.status(200).json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Error getting project by customer head ID:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get project'
    });
  }
};

// Get customer employees by project
const getCustomerEmployeesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const employees = await callProcedure('sp_GetCustomerEmployeesByProject', [projectId]);
    
    res.status(200).json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error('Error getting customer employees by project:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get customer employees'
    });
  }
};

// Get customer heads by project
const getCustomerHeadsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const heads = await callProcedure('sp_GetCustomerHeadsByProject', [projectId]);
    
    res.status(200).json({
      success: true,
      data: heads
    });
  } catch (error) {
    console.error('Error getting customer heads by project:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get customer heads'
    });
  }
};

const getCustomerTeamMembers = async (req, res) => {
    try {
        const { projectId } = req.query;
        if (!projectId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Project ID is required' 
            });
        }
        
        // First get the project to verify it exists and get customer_company_id
        const project = await callProcedure('sp_GetProjectById', [projectId]);
        if (!project || !project[0]) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }
        
        // Get customer employees for this project
        const members = await callProcedure('sp_GetCustomerEmployeesByProject', [projectId]);
        
        // Filter out the customer team head (is_head = true)
        const teamMembers = members.filter(member => !member.is_head);
        
        res.status(200).json({ 
            success: true, 
            data: teamMembers 
        });
    } catch (error) {
        console.error('Error getting customer team members:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Assign a customer as team head for a project
const assignCustomerTeamHead = async (req, res) => {
  try {
    const { projectId, customerEmployeeId } = req.body;
    
    if (!projectId || !customerEmployeeId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID and Customer Employee ID are required'
      });
    }

    // First, get the customer company ID from the project
    const project = await callProcedure('sp_GetProjectById', [projectId]);
    if (!project || !project[0] || !project[0].customer_company_id) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or does not have an associated customer company'
      });
    }
    
    const customerCompanyId = project[0].customer_company_id;
    
    // First, set is_head = FALSE for all employees in this customer company
    await callProcedure('sp_UpdateCustomerEmployeeSetHead', [customerCompanyId, false]);
    
    // Then set is_head = TRUE for the selected employee
    await callProcedure('sp_UpdateCustomerEmployeeHeadStatus', [customerEmployeeId, true]);
    
    // Get the updated employee data
    const [updatedEmployee] = await callProcedure('sp_GetCustomerEmployeeById', [customerEmployeeId]);
    
    res.status(200).json({
      success: true,
      data: updatedEmployee
    });
  } catch (error) {
    console.error('Error assigning customer team head:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to assign customer team head'
    });
  }
};

// Remove customer team head from a project
const removeCustomerTeamHead = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Get the customer company ID from the project
    const project = await callProcedure('sp_GetProjectById', [projectId]);
    if (!project || !project[0] || !project[0].customer_company_id) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or does not have an associated customer company'
      });
    }
    
    const customerCompanyId = project[0].customer_company_id;
    
    // Set is_head = FALSE for all employees in this customer company
    await callProcedure('sp_UpdateCustomerEmployeeSetHead', [customerCompanyId, false]);
    
    res.status(200).json({
      success: true,
      message: 'Customer team head removed successfully'
    });
  } catch (error) {
    console.error('Error removing customer team head:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove customer team head'
    });
  }
};

module.exports = {
  getProjectIdByCustomerHeadId,
  getCustomerEmployeesByProject,
  getCustomerHeadsByProject,
  getCustomerTeamMembers,
  assignCustomerTeamHead,
  removeCustomerTeamHead
};
