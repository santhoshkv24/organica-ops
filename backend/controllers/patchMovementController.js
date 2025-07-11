const { callProcedure } = require('../utils/dbUtils');

exports.createPatchMovementRequest = async (req, res) => {
    try {
        const {
            project_id,
            patch_name,
            patch_description,
            patch_type,
            severity,
            environment_affected,
            estimated_deployment_time,
            scheduled_deployment_time,
            attached_document
        } = req.body;
        
        const requested_by = req.user.user_id;

        const [result] = await callProcedure('sp_CreatePatchMovementRequest', [
            project_id,
            patch_name,
            patch_description,
            patch_type,
            severity,
            environment_affected,
            estimated_deployment_time,
            scheduled_deployment_time || null,
            attached_document || null,
            requested_by
        ]);

        res.status(201).json({
            success: true,
            data: result[0] || {},
            message: 'Patch movement request created successfully'
        });
    } catch (error) {
        console.error('Error creating patch movement request:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to create patch movement request',
            error: error.message 
        });
    }
};

exports.getPatchMovementRequestsByProject = async (req, res) => {
    try {
        const { project_id } = req.params;
        const results = await callProcedure('sp_GetPatchMovementRequestsByProject', [project_id]);
        
        res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error('Error getting patch movement requests by project:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to get patch movement requests by project',
            error: error.message 
        });
    }
};

exports.getPatchMovementRequestById = async (req, res) => {
    try {
        const { patch_id } = req.params;
        const results = await callProcedure('sp_GetPatchMovementRequestById', [patch_id]);
        
        if (!results || results.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Patch movement request not found' 
            });
        }
        
        res.status(200).json({
            success: true,
            data: results[0] || {}
        });
    } catch (error) {
        console.error('Error getting patch movement request by ID:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to get patch movement request',
            error: error.message 
        });
    }
};

exports.updatePatchMovementRequestStatus = async (req, res) => {
    try {
        const { patch_id } = req.params;
        const { status, approved_by } = req.body;
        const approver_id = approved_by || req.user.user_id;

        const results = await callProcedure('sp_UpdatePatchMovementRequestStatus', [
            patch_id, 
            status, 
            approver_id
        ]);

        if (!results || results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Patch movement request not found or not updated'
            });
        }

        res.status(200).json({
            success: true,
            message: `Patch request status updated to ${status}`,
            data: results[0] || {}
        });
    } catch (error) {
        console.error('Error updating patch movement status:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to update patch movement status',
            error: error.message 
        });
    }
};

// Get patch movement requests by team lead ID
exports.getPatchMovementRequestByTeamLeadId = async (req, res) => {
    try {
        const { teamLeadId } = req.params;
        const results = await callProcedure('sp_GetPatchMovementRequestByTeamLeadId', [teamLeadId]);
        
        res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error('Error getting patch movement requests by team lead ID:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to get patch movement requests',
            error: error.message 
        });
    }
};

// Get patch movement requests by requester (user)
exports.getPatchMovementRequestsByUser = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.user_id;
        const results = await callProcedure('sp_GetPatchMovementRequestsByUser', [userId]);
        
        res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error('Error getting patch movement requests by user:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to get user patch movement requests',
            error: error.message 
        });
    }
};
