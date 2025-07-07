const { callProcedure, getOneProcedure } = require('../utils/dbUtils');

// Create a new customer track entry
const createCustomerTrackEntry = async (req, res) => {
  try {
    const {
      project_id,
      assigned_to, // customer_employee_id
      title,
      description,
      task_type = 'Task',
      priority = 'Medium',
      status = 'To Do',
      due_date
    } = req.body;

    // Current user is the assigner
    const assigned_by = req.user?.user_id || null;
    
    if (!assigned_by) {
      return res.status(400).json({
        success: false,
        message: 'User ID is missing from authentication token'
      });
    }

    // Validate project_id and assigned_to
    if (!project_id || !assigned_to) {
      return res.status(400).json({
        success: false,
        message: 'Project ID and assigned to are required'
      });
    }

    const result = await callProcedure('sp_CreateCustomerTrackEntry', [
      project_id,
      assigned_to,
      assigned_by,
      title,
      description,
      task_type,
      priority,
      status,
      due_date ? new Date(due_date).toISOString().split('T')[0] : null
    ]);

    const entryId = result[0]?.customer_track_entry_id;
    
    // Get the created entry
    const newEntry = await getOneProcedure('sp_GetCustomerTrackEntryById', [
      entryId, 
      assigned_by, 
      req.user.role.startsWith('customer')
    ]);

    res.status(201).json({
      success: true,
      data: newEntry
    });
  } catch (error) {
    console.error('Error creating customer track entry:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create customer track entry'
    });
  }
};

// Get customer track entry by ID
const getCustomerTrackEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id || null;
    const isCustomer = req.user.role.startsWith('customer');

    const entry = await getOneProcedure('sp_GetCustomerTrackEntryById', [
      id, 
      user_id, 
      isCustomer
    ]);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Customer track entry not found or access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Error getting customer track entry:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get customer track entry'
    });
  }
};

// Update customer track entry
const updateCustomerTrackEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      task_type,
      priority,
      status,
      due_date
    } = req.body;
    console.log(req)
    const user_id = req.user.user_id  || null;
    const isCustomer = req.user.role.startsWith('customer');

    await callProcedure('sp_UpdateCustomerTrackEntry', [
      id,
      user_id,
      isCustomer,
      title || null,
      description || null,
      task_type || null,
      priority || null,
      status || null,
      due_date || null
    ]);

    // Get the updated entry
    const updatedEntry = await getOneProcedure('sp_GetCustomerTrackEntryById', [
      id,
      user_id,
      isCustomer
    ]);

    if (!updatedEntry) {
      return res.status(404).json({
        success: false,
        message: 'Customer track entry not found after update'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedEntry
    });
  } catch (error) {
    console.error('Error updating customer track entry:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update customer track entry'
    });
  }
};

// Delete customer track entry
const deleteCustomerTrackEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id || null;

    // Only admin and managers can delete entries
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete track entries'
      });
    }

    const result = await callProcedure('sp_DeleteCustomerTrackEntry', [
      id,
      user_id
    ]);

    if (result[0]?.deleted_rows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer track entry not found or access denied'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer track entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer track entry:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete customer track entry'
    });
  }
};

// Get customer track entries with filters
const getCustomerTrackEntries = async (req, res) => {
  try {
    const {
      project_id,
      customer_company_id,
      assigned_to,
      assigned_by,
      status,
      priority,
      task_type,
      start_date,
      end_date,
      page = 1,
      limit = 10
    } = req.query;

    const offset = (page - 1) * limit;
    const user_id = req.user.user_id || null;
    const isCustomer = req.user.role.startsWith('customer');

    const entries = await callProcedure('sp_GetCustomerTrackEntries', [
      project_id || null,
      customer_company_id || null,
      assigned_to || null,
      assigned_by || null,
      status || null,
      priority || null,
      task_type || null,
      start_date || null,
      end_date || null,
      parseInt(limit),
      parseInt(offset),
      user_id,
      isCustomer
    ]);

    res.status(200).json({
      success: true,
      data: entries[0] || [],
      pagination: {
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
        totalItems: entries[1]?.[0]?.total_count || 0,
        totalPages: Math.ceil((entries[1]?.[0]?.total_count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error getting customer track entries:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get customer track entries'
    });
  }
};

// Update customer track entry status
const updateCustomerTrackEntryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user_id = req.user.user_id || null;
    const isCustomer = req.user.role.startsWith('customer');

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Use the dedicated status update procedure
    await callProcedure('sp_UpdateCustomerTrackEntryStatus', [
      id,
      status,
      user_id,
      isCustomer
    ]);

    // Get the updated entry
    const updatedEntry = await getOneProcedure('sp_GetCustomerTrackEntryById', [
      id,
      user_id,
      isCustomer
    ]);

    res.status(200).json({
      success: true,
      data: updatedEntry
    });
  } catch (error) {
    console.error('Error updating customer track entry status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update customer track entry status'
    });
  }
};

// Get customer dashboard data
const getCustomerDashboardData = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(400).json({
        success: false,
        message: 'User authentication failed',
        details: 'User object is missing from request'
      });
    }

    if (!req.user.user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
        details: 'User ID is missing from user object'
      });
    }
    
    console.log('Fetching customer dashboard data for user:', req.user.user_id);
    const dashboardData = await callProcedure('sp_GetCustomerEmployeeDashboard', [req.user.user_id]);
    
    // Debug log
    console.log('Customer dashboard data returned:', JSON.stringify(dashboardData, null, 2));

    res.status(200).json({
      success: true,
      data: dashboardData || []
    });
  } catch (error) {
    console.error('Error getting customer dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get customer dashboard data',
      error: error.message
    });
  }
};

// Get customer track entries by assigned_by
const getCustomerTrackEntriesByAssignedBy = async (req, res) => {
  try {
    const { assignedById } = req.params;
    const {
      project_id,
      status,
      priority,
      task_type,
      start_date,
      end_date
    } = req.query;

    if (!assignedById) {
      return res.status(400).json({
        success: false,
        message: 'Assigned by ID is required'
      });
    }

    const user_id = req.user.user_id || null;

    console.log('Fetching customer tasks assigned by:', assignedById);

    // Use the dedicated stored procedure for getting tasks by assigned_by
    const entries = await callProcedure('sp_GetCustomerTrackEntriesByAssignedBy', [
      assignedById,
      user_id,
      project_id || null,
      status || null,
      priority || null,
      task_type || null,
      start_date || null,
      end_date || null
    ]);
    
    console.log('Customer entries returned from SP:', entries);

    // Always ensure we're returning an array of tasks
    let tasksData = [];
    
    if (entries && entries.length > 0) {
      if (Array.isArray(entries[0])) {
        tasksData = entries[0];
      } else if (entries[0] && typeof entries[0] === 'object') {
        // If it's a single object, put it in an array
        tasksData = [entries[0]];
      }
    }

    console.log('Final customer response data (array format):', tasksData);
    console.log('Number of customer tasks returned:', tasksData.length);

    res.status(200).json({
      success: true,
      data: tasksData
    });
  } catch (error) {
    console.error('Error getting customer track entries by assigned by:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get customer track entries by assigned by'
    });
  }
};

// Get all tasks for a customer company (for customer team heads)
const getCustomerCompanyTasks = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(400).json({
        success: false,
        message: 'User authentication failed',
        details: 'User object is missing from request'
      });
    }

    if (!req.user.user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
        details: 'User ID is missing from user object'
      });
    }
    
    console.log('Fetching company tasks for customer team head:', req.user.user_id);
    const companyTasks = await callProcedure('sp_GetCustomerCompanyTasks', [req.user.user_id]);
    
    // Debug log
    console.log('Customer company tasks returned:', companyTasks ? companyTasks.length : 0);

    res.status(200).json({
      success: true,
      data: companyTasks || []
    });
  } catch (error) {
    console.error('Error getting customer company tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get customer company tasks',
      error: error.message
    });
  }
};

module.exports = {
  createCustomerTrackEntry,
  getCustomerTrackEntry,
  updateCustomerTrackEntry,
  deleteCustomerTrackEntry,
  getCustomerTrackEntries,
  updateCustomerTrackEntryStatus,
  getCustomerDashboardData,
  getCustomerTrackEntriesByAssignedBy,
  getCustomerCompanyTasks
};