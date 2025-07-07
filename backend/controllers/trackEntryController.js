// backend/controllers/trackEntryController.js
const { callProcedure, getOneProcedure, beginTransaction, commit, rollback } = require('../utils/dbUtils');

// Create a new track entry
const createTrackEntry = async (req, res) => {
    try {
        // Handle both employee_id and assigned_to for backward compatibility
        const {
            project_id,
            team_id,
            employee_id,
            assigned_to,  // This is the field used by the frontend
            title,
            description,
            task_type = 'Task',
            priority = 'Medium',
            status = 'To Do',
            due_date,
            hours_spent = 0
        } = req.body;
        
        // Use assigned_to if employee_id is not provided (frontend sends assigned_to)
        const employeeId = employee_id || assigned_to;

        // Validate required fields
        if (!project_id || !team_id || !title) {
            return res.status(400).json({
                success: false,
                message: 'Project ID, Team ID, and Title are required fields'
            });
        }

        if (!req.user?.user_id) {
            return res.status(400).json({
                success: false,
                message: 'User authentication failed'
            });
        }

        console.log('Creating track entry with params:', {
            project_id,
            team_id,
            employee_id: employeeId || null,
            assigned_to: assigned_to || null,
            assigned_by: req.user.user_id,
            title,
            description: description || null,
            task_type,
            priority,
            status,
            due_date: due_date || null,
            hours_spent
        });

        const result = await callProcedure('sp_CreateTrackEntry', [
            project_id,
            team_id,
            employeeId || null, // Can be null for unassigned tasks
            req.user.user_id,   // assigned_by is the current user
            title,
            description || null,
            task_type,
            priority,
            status,
            due_date || null,
            hours_spent
        ]);

        res.status(201).json({
            success: true,
            data: { track_entry_id: result[0].track_entry_id }
        });
    } catch (error) {
        console.error('Error creating track entry:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create track entry'
        });
    }
};

// Get track entry by ID
const getTrackEntry = async (req, res) => {
    try {
        const trackEntry = await getOneProcedure('sp_GetTrackEntryById', [
            req.params.id,
            req.user.user_id
        ]);

        if (!trackEntry) {
            return res.status(404).json({
                success: false,
                message: 'Track entry not found or access denied'
            });
        }

        res.status(200).json({
            success: true,
            data: trackEntry
        });
    } catch (error) {
        console.error('Error getting track entry:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get track entry'
        });
    }
};

// Update track entry
const updateTrackEntry = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        await callProcedure('sp_UpdateTrackEntry', [
            id,
            req.user.user_id,
            updates.title || null,
            updates.description || null,
            updates.task_type || null,
            updates.priority || null,
            updates.status || null,
            updates.due_date || null,
            updates.hours_spent !== undefined ? updates.hours_spent : null,
            updates.hours_worked !== undefined ? updates.hours_worked : null
        ]);

        // Get updated entry
        const updatedEntry = await getOneProcedure('sp_GetTrackEntryById', [
            id,
            req.user.user_id
        ]);

        res.status(200).json({
            success: true,
            data: updatedEntry
        });
    } catch (error) {
        console.error('Error updating track entry:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update track entry'
        });
    }
};

// Delete track entry
const deleteTrackEntry = async (req, res) => {
    try {
        await callProcedure('sp_DeleteTrackEntry', [
            req.params.id,
            req.user.user_id
        ]);

        res.status(200).json({
            success: true,
            message: 'Track entry deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting track entry:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete track entry'
        });
    }
};

// Get track entries with filters
const getTrackEntries = async (req, res) => {
    const {
        project_id,
        employee_id,
        status,
        priority,
        task_type,
        start_date,
        end_date,
        page = 1,
        limit = 10
    } = req.query;
    
    // If user is not admin/manager, only show their assigned tasks
    const assigned_to_me = (req.user.role !== 'admin' && req.user.role !== 'manager') 
        ? req.user.user_id 
        : null;

    const offset = (page - 1) * limit;

    try {
        const trackEntries = await callProcedure('sp_GetTrackEntries', [
            project_id || null,
            employee_id || null,
            assigned_to_me,
            status || null,
            priority || null,
            task_type || null,
            start_date ? new Date(start_date) : null,
            end_date ? new Date(end_date) : null,
            parseInt(limit),
            parseInt(offset)
        ]);

        res.status(200).json({
            success: true,
            data: trackEntries[0] || [],
            pagination: {
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit),
                totalItems: trackEntries[1]?.[0]?.total_count || 0,
                totalPages: Math.ceil((trackEntries[1]?.[0]?.total_count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error getting track entries:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get track entries'
        });
    }
};

// Get assignable employees
const getAssignableEmployees = async (req, res) => {
    try {
        console.log('=== Request Headers ===');
        console.log(req.headers);
        console.log('=== Request User ===');
        console.log(req.user);
        console.log('=== Request Query ===');
        console.log(req.query);
        
        const { project_id, team_id } = req.query;
        
        // Validate required parameters
        if (!project_id) {
            console.error('Project ID is required');
            return res.status(400).json({
                success: false,
                message: 'Project ID is required'
            });
        }

        if (!req.user) {
            console.error('User object is missing from request');
            return res.status(400).json({
                success: false,
                message: 'User authentication failed',
                details: 'User object is missing from request'
            });
        }

        // Use user_id instead of id
        if (!req.user.user_id) {
            console.error('User ID is missing from user object');
            console.log('Full user object:', JSON.stringify(req.user, null, 2));
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
                details: 'User ID (user_id) is missing from user object',
                userObject: req.user
            });
        }

        console.log('Fetching assignable employees with params:', {
            project_id,
            team_id: team_id || 'not provided',
            user_id: req.user.user_id,
            user_role: req.user.role
        });

        const employees = await callProcedure('sp_GetAssignableEmployees', [
            project_id,
            team_id || null,
            req.user.user_id  // Use user_id instead of id
        ]);

        console.log('Found employees:', employees.length);
        res.status(200).json({
            success: true,
            data: employees
        });
    } catch (error) {
        console.error('Error getting assignable employees:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get assignable employees'
        });
    }
};

// Get dashboard data
const getDashboardData = async (req, res) => {
    try {
        if (!req.user) {
            console.error('User object is missing from request');
            return res.status(400).json({
                success: false,
                message: 'User authentication failed',
                details: 'User object is missing from request'
            });
        }

        if (!req.user.user_id) {
            console.error('User ID is missing from user object');
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
                details: 'User ID (user_id) is missing from user object',
                userObject: req.user
            });
        }
        
        console.log('Fetching dashboard data for user:', req.user.user_id);
        const dashboardData = await callProcedure('sp_GetEmployeeDashboard', [req.user.user_id]);
        
        // Debug log to see what's being returned
        console.log('Dashboard data returned:', JSON.stringify(dashboardData, null, 2));

        res.status(200).json({
            success: true,
            data: dashboardData || []
        });
    } catch (error) {
        console.error('Error getting dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get dashboard data',
            error: error.message
        });
    }
};

// Get task statistics
const getTaskStatistics = async (req, res) => {
    try {
        if (!req.user) {
            console.error('User object is missing from request');
            return res.status(400).json({
                success: false,
                message: 'User authentication failed',
                details: 'User object is missing from request'
            });
        }

        if (!req.user.user_id) {
            console.error('User ID is missing from user object');
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
                details: 'User ID (user_id) is missing from user object',
                userObject: req.user
            });
        }
        
        const { project_id } = req.query;
        
        console.log('Fetching task statistics for user:', req.user.user_id, 'project_id:', project_id);
        const stats = await callProcedure('sp_GetTaskStatistics', [
            req.user.user_id,
            project_id || null
        ]);

        res.status(200).json({
            success: true,
            data: stats[0] || {}
        });
    } catch (error) {
        console.error('Error getting task statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get task statistics',
            error: error.message
        });
    }
};

// Update track entry status
const updateTrackEntryStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!req.user?.user_id) {
        return res.status(400).json({
            success: false,
            message: 'User ID is missing from authentication token'
        });
    }

    try {
        await callProcedure('sp_UpdateTrackEntryStatus', [
            id,
            status,
            req.user.user_id  // Changed from req.user.id to req.user.user_id
        ]);

        // Get updated entry
        const updatedEntry = await getOneProcedure('sp_GetTrackEntryById', [
            id,
            req.user.user_id  // Changed from req.user.id to req.user.user_id
        ]);

        res.status(200).json({
            success: true,
            data: updatedEntry
        });
    } catch (error) {
        console.error('Error updating track entry status:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update track entry status'
        });
    }
};

// Log hours worked
const logHoursWorked = async (req, res) => {
    const { id } = req.params;
    const { hours } = req.body;

    try {
        await callProcedure('sp_UpdateTrackEntryHours', [
            id,
            parseFloat(hours),
            req.user.user_id
        ]);

        // Get updated entry
        const updatedEntry = await getOneProcedure('sp_GetTrackEntryById', [
            id,
            req.user.user_id
        ]);

        res.status(200).json({
            success: true,
            data: updatedEntry
        });
    } catch (error) {
        console.error('Error logging hours worked:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to log hours worked'
        });
    }
};

// Get track entries by employee
const getTrackEntriesByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const {
            project_id,
            team_id,
            status,
            priority,
            task_type,
            start_date,
            end_date,
            page = 1,
            limit = 10
        } = req.query;

        const offset = (page - 1) * limit;

        const trackEntries = await callProcedure('sp_GetTrackEntries', [
            project_id || null,
            team_id || null,
            employeeId,
            null, // Not filtering by assigned_to_me
            status || null,
            priority || null,
            task_type || null,
            start_date || null,
            end_date || null,
            parseInt(limit),
            parseInt(offset)
        ]);

        res.status(200).json({
            success: true,
            data: trackEntries[0] || [],
            pagination: {
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit),
                totalItems: trackEntries[1]?.[0]?.total_count || 0,
                totalPages: Math.ceil((trackEntries[1]?.[0]?.total_count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error getting track entries by employee:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get track entries by employee'
        });
    }
};

// Get track entries by assigned_by
const getTrackEntriesByAssignedBy = async (req, res) => {
    const filters = req.query;
    const { assignedById } = req.params;

    try {
        if (!req.user || !req.user.user_id) {
            return res.status(400).json({
                success: false,
                message: 'User authentication failed',
                details: 'User ID is missing from request'
            });
        }

        console.log('Fetching tasks assigned by:', assignedById);
        
        // Call the simplified stored procedure that just returns tasks
        const result = await callProcedure('sp_GetTrackEntriesByAssignedBy', [
            assignedById, // assigned_by is from the URL parameter
            req.user.user_id, // user_id for permission check
            filters.project_id || null,
            filters.status || null,
            filters.priority || null,
            filters.task_type || null,
            filters.start_date ? new Date(filters.start_date) : null,
            filters.end_date ? new Date(filters.end_date) : null,
            parseInt(filters.limit || 10),
            parseInt(filters.offset || 0)
        ]);

        console.log('Entries returned from SP:', result);
        
        // Simplified response - just return the tasks array
        const tasksData = result;
        
        console.log('Final response data:', tasksData);

        res.status(200).json({
            success: true,
            data: tasksData
        });
    } catch (error) {
        console.error('Error getting track entries by assignedBy:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get track entries by assignedBy',
            error: error.message
        });
    }
};

// Get all tasks for projects managed by a project manager
const getProjectManagerTasks = async (req, res) => {
    try {
        const { managerId } = req.params;
        
        if (!managerId) {
            return res.status(400).json({
                success: false,
                message: 'Manager ID is required'
            });
        }

        console.log(`Fetching tasks for projects managed by manager ID: ${managerId}`);
        
        const tasks = await callProcedure('sp_GetProjectManagerTasks', [managerId]);
        
        console.log(`Retrieved ${tasks.length} tasks for project manager ${managerId}`);
        
        res.status(200).json({
            success: true,
            data: tasks
        });
    } catch (error) {
        console.error('Error getting project manager tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get project manager tasks',
            error: error.message
        });
    }
};

// Get all tasks for teams led by a team lead
const getTeamLeadTasks = async (req, res) => {
    try {
        const { teamLeadId } = req.params;
        
        if (!teamLeadId) {
            return res.status(400).json({
                success: false,
                message: 'Team Lead ID is required'
            });
        }

        console.log(`Fetching tasks for teams led by team lead ID: ${teamLeadId}`);
        
        const tasks = await callProcedure('sp_GetTeamLeadTasks', [teamLeadId]);
        
        console.log(`Retrieved ${tasks.length} tasks for team lead ${teamLeadId}`);
        
        res.status(200).json({
            success: true,
            data: tasks
        });
    } catch (error) {
        console.error('Error getting team lead tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get team lead tasks',
            error: error.message
        });
    }
};

module.exports = {
    createTrackEntry,
    getTrackEntry,
    updateTrackEntry,
    deleteTrackEntry,
    getTrackEntries,
    getAssignableEmployees,
    getDashboardData,
    getTaskStatistics,
    updateTrackEntryStatus,
    logHoursWorked,
    getTrackEntriesByEmployee,
    getTrackEntriesByAssignedBy,
    getProjectManagerTasks,
    getTeamLeadTasks
};