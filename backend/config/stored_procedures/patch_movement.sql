-- ============================
-- PATCH MOVEMENT
-- ============================

-- Create a new patch movement request
DELIMITER //
CREATE PROCEDURE sp_CreatePatchMovementRequest(
    IN p_project_id INT,
    IN p_patch_name VARCHAR(255),
    IN p_patch_description TEXT,
    IN p_patch_type ENUM('Hotfix','Security Update','Feature Patch','Bug Fix','Emergency','Maintenance'),
    IN p_severity ENUM('Low','Medium','High','Critical'),
    IN p_environment_affected ENUM('Dev','QA','UAT','Production','All'),
    IN p_estimated_deployment_time INT,
    IN p_scheduled_deployment_time DATETIME,
    IN p_attached_document VARCHAR(500),
    IN p_requested_by INT
)
BEGIN
    DECLARE v_team_id INT;
    DECLARE v_team_lead_id INT;

    -- Get the team_id of the requester
    SELECT team_id INTO v_team_id
    FROM employees e
    JOIN users u ON e.employee_id = u.employee_id
    WHERE u.user_id = p_requested_by;

    -- Get the team lead for that team in the specified project
    SELECT u.user_id INTO v_team_lead_id
    FROM project_team_members ptm
    JOIN employees e ON ptm.employee_id = e.employee_id
    JOIN users u ON e.employee_id = u.employee_id
    WHERE ptm.project_id = p_project_id
      AND e.team_id = v_team_id
      AND ptm.role = 'team_lead'
    LIMIT 1;

    -- Insert the new patch movement request
    INSERT INTO patch_movement_requests (
        project_id,
        patch_name,
        patch_description,
        patch_type,
        severity,
        environment_affected,
        estimated_deployment_time,
        scheduled_deployment_time,
        attached_document,
        requested_by,
        team_lead_id
    ) VALUES (
        p_project_id,
        p_patch_name,
        p_patch_description,
        p_patch_type,
        p_severity,
        p_environment_affected,
        p_estimated_deployment_time,
        p_scheduled_deployment_time,
        p_attached_document,
        p_requested_by,
        v_team_lead_id
    );

    SELECT LAST_INSERT_ID() AS patch_id;
END //
DELIMITER ;

-- Get all patch movement requests for a project with additional details
DELIMITER //
CREATE PROCEDURE sp_GetPatchMovementRequestsByProject(IN p_project_id INT)
BEGIN
    SELECT 
        pmr.*,
        p.name AS project_name,
        CONCAT(u_req.username) AS requester_name,
        CONCAT(e_req.first_name, ' ', e_req.last_name) AS requester_full_name,
        CONCAT(u_app.username) AS approved_by_name,
        CONCAT(e_app.first_name, ' ', e_app.last_name) AS approved_by_full_name,
        CONCAT(u_lead.username) AS team_lead_name,
        CONCAT(e_lead.first_name, ' ', e_lead.last_name) AS team_lead_full_name
    FROM patch_movement_requests pmr
    JOIN projects p ON pmr.project_id = p.project_id
    JOIN users u_req ON pmr.requested_by = u_req.user_id
    LEFT JOIN employees e_req ON u_req.employee_id = e_req.employee_id
    LEFT JOIN users u_app ON pmr.approved_by = u_app.user_id
    LEFT JOIN employees e_app ON u_app.employee_id = e_app.employee_id
    LEFT JOIN users u_lead ON pmr.team_lead_id = u_lead.user_id
    LEFT JOIN employees e_lead ON u_lead.employee_id = e_lead.employee_id
    WHERE pmr.project_id = p_project_id
    ORDER BY pmr.created_at DESC;
END //
DELIMITER ;

-- Get a patch movement request by ID with additional details
DELIMITER //
CREATE PROCEDURE sp_GetPatchMovementRequestById(IN p_patch_id INT)
BEGIN
    SELECT 
        pmr.*,
        p.name AS project_name,
        CONCAT(u_req.username) AS requester_name,
        CONCAT(e_req.first_name, ' ', e_req.last_name) AS requester_full_name,
        CONCAT(u_app.username) AS approved_by_name,
        CONCAT(e_app.first_name, ' ', e_app.last_name) AS approved_by_full_name,
        CONCAT(u_lead.username) AS team_lead_name,
        CONCAT(e_lead.first_name, ' ', e_lead.last_name) AS team_lead_full_name
    FROM patch_movement_requests pmr
    JOIN projects p ON pmr.project_id = p.project_id
    JOIN users u_req ON pmr.requested_by = u_req.user_id
    LEFT JOIN employees e_req ON u_req.employee_id = e_req.employee_id
    LEFT JOIN users u_app ON pmr.approved_by = u_app.user_id
    LEFT JOIN employees e_app ON u_app.employee_id = e_app.employee_id
    LEFT JOIN users u_lead ON pmr.team_lead_id = u_lead.user_id
    LEFT JOIN employees e_lead ON u_lead.employee_id = e_lead.employee_id
    WHERE pmr.patch_id = p_patch_id;
END //
DELIMITER ;

-- Get patch movement requests by team lead ID with additional details
DELIMITER //
CREATE PROCEDURE sp_GetPatchMovementRequestByTeamLeadId(IN p_team_lead_id INT)
BEGIN
    SELECT 
        pmr.*,
        p.name AS project_name,
        CONCAT(u_req.username) AS requester_name,
        CONCAT(e_req.first_name, ' ', e_req.last_name) AS requester_full_name,
        CONCAT(u_app.username) AS approved_by_name,
        CONCAT(e_app.first_name, ' ', e_app.last_name) AS approved_by_full_name
    FROM patch_movement_requests pmr
    JOIN projects p ON pmr.project_id = p.project_id
    JOIN users u_req ON pmr.requested_by = u_req.user_id
    LEFT JOIN employees e_req ON u_req.employee_id = e_req.employee_id
    LEFT JOIN users u_app ON pmr.approved_by = u_app.user_id
    LEFT JOIN employees e_app ON u_app.employee_id = e_app.employee_id
    WHERE pmr.team_lead_id = p_team_lead_id
    ORDER BY pmr.created_at DESC;
END //
DELIMITER ;

-- Get patch movement requests by user ID (requester) with additional details
DELIMITER //
CREATE PROCEDURE sp_GetPatchMovementRequestsByUser(IN p_user_id INT)
BEGIN
    SELECT 
        pmr.*,
        p.name AS project_name,
        CONCAT(u_app.username) AS approved_by_name,
        CONCAT(e_app.first_name, ' ', e_app.last_name) AS approved_by_full_name,
        CONCAT(u_lead.username) AS team_lead_name,
        CONCAT(e_lead.first_name, ' ', e_lead.last_name) AS team_lead_full_name
    FROM patch_movement_requests pmr
    JOIN projects p ON pmr.project_id = p.project_id
    LEFT JOIN users u_app ON pmr.approved_by = u_app.user_id
    LEFT JOIN employees e_app ON u_app.employee_id = e_app.employee_id
    LEFT JOIN users u_lead ON pmr.team_lead_id = u_lead.user_id
    LEFT JOIN employees e_lead ON u_lead.employee_id = e_lead.employee_id
    WHERE pmr.requested_by = p_user_id
    ORDER BY pmr.created_at DESC;
END //
DELIMITER ;

-- Update the status of a patch movement request
DELIMITER //
CREATE PROCEDURE sp_UpdatePatchMovementRequestStatus(
    IN p_patch_id INT,
    IN p_status ENUM('Pending','Approved','Rejected','On Hold','Deployed','Cancelled'),
    IN p_approved_by INT
)
BEGIN
    UPDATE patch_movement_requests
    SET
        status = p_status,
        approved_by = p_approved_by,
        approved_at = CASE WHEN p_status = 'Approved' THEN CURRENT_TIMESTAMP ELSE approved_at END,
        updated_at = CURRENT_TIMESTAMP
    WHERE patch_id = p_patch_id;

    -- Return updated record with details
    SELECT 
        pmr.*,
        p.name AS project_name,
        CONCAT(u_req.username) AS requester_name,
        CONCAT(e_req.first_name, ' ', e_req.last_name) AS requester_full_name,
        CONCAT(u_app.username) AS approved_by_name,
        CONCAT(e_app.first_name, ' ', e_app.last_name) AS approved_by_full_name
    FROM patch_movement_requests pmr
    JOIN projects p ON pmr.project_id = p.project_id
    JOIN users u_req ON pmr.requested_by = u_req.user_id
    LEFT JOIN employees e_req ON u_req.employee_id = e_req.employee_id
    LEFT JOIN users u_app ON pmr.approved_by = u_app.user_id
    LEFT JOIN employees e_app ON u_app.employee_id = e_app.employee_id
    WHERE pmr.patch_id = p_patch_id;
END //
DELIMITER ;
