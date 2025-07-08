const db = require('../config/database');
const { callProcedure } = require('../utils/dbUtils');

exports.createPatchMovementRequest = async (req, res) => {
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

    try {
        const [result] = await db.query('CALL sp_CreatePatchMovementRequest(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            project_id,
            patch_name,
            patch_description,
            patch_type,
            severity,
            environment_affected,
            estimated_deployment_time,
            scheduled_deployment_time,
            attached_document,
            requested_by
        ]);
        res.status(201).json(result[0][0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPatchMovementRequestsByProject = async (req, res) => {
    const { project_id } = req.params;

    try {
        const [results] = await db.query('CALL sp_GetPatchMovementRequestsByProject(?)', [project_id]);
        res.json(results[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPatchMovementRequestById = async (req, res) => {
    const { patch_id } = req.params;

    try {
        const [results] = await db.query('CALL sp_GetPatchMovementRequestById(?)', [patch_id]);
        if (results[0].length === 0) {
            return res.status(404).json({ message: 'Patch movement request not found' });
        }
        res.json(results[0][0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updatePatchMovementRequestStatus = async (req, res) => {
    const { patch_id } = req.params;
    const { status } = req.body;

    try {
        const [result] = await db.query('CALL sp_UpdatePatchMovementRequestStatus(?, ?)', [patch_id, status]);
        res.json(result[0][0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get patch movement requests by team lead ID
exports.getPatchMovementRequestByTeamLeadId = async (req, res) => {
    try {
        const { teamLeadId } = req.params;
        const requests = await callProcedure('sp_GetPatchMovementRequestByTeamLeadId', [teamLeadId]);
        
        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
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
