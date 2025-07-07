-- ============================
-- PROJECT TEAM MEMBERS
-- ============================

-- Add a member to a project team
DELIMITER //
CREATE PROCEDURE sp_CreateProjectTeamMember(
    IN p_project_id INT,
    IN p_employee_id INT,
    IN p_role ENUM('team_member', 'team_lead'),
    IN p_added_by INT
)
BEGIN
    DECLARE v_team_id INT;
    DECLARE v_is_team_lead BOOLEAN DEFAULT FALSE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    
    -- Check if project exists
    IF NOT EXISTS (SELECT 1 FROM projects WHERE project_id = p_project_id) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Project not found';
    END IF;
    
    -- Check if employee exists and get their team
    SELECT team_id INTO v_team_id 
    FROM employees 
    WHERE employee_id = p_employee_id;
    
    IF v_team_id IS NULL THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Employee not found';
    END IF;
    
    -- Check if employee is a team lead
    SELECT 1 INTO v_is_team_lead
    FROM team_leads
    WHERE employee_id = p_employee_id 
    AND team_id = v_team_id
    LIMIT 1;
    
    -- If employee is a team lead, override the role to 'team_lead'
    IF v_is_team_lead = 1 THEN
        SET p_role = 'team_lead';
    END IF;
    
    -- Check if relationship already exists
    IF EXISTS (SELECT 1 FROM project_team_members WHERE project_id = p_project_id AND employee_id = p_employee_id) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Employee is already a member of this project team';
    END IF;
    
    -- Add employee to project team
    INSERT INTO project_team_members (project_id, employee_id, role, added_by)
    VALUES (p_project_id, p_employee_id, p_role, p_added_by);
    
    COMMIT;
    
    -- Return the newly created team member
    SELECT 
        ptm.project_team_member_id,
        ptm.project_id,
        p.name AS project_name,
        ptm.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.email AS employee_email,
        e.team_id,
        t.name AS team_name,
        ptm.role,
        ptm.added_by,
        CONCAT(a.username) AS added_by_name,
        ptm.created_at
    FROM project_team_members ptm
    JOIN projects p ON ptm.project_id = p.project_id
    JOIN employees e ON ptm.employee_id = e.employee_id
    LEFT JOIN teams t ON e.team_id = t.team_id
    LEFT JOIN users a ON ptm.added_by = a.user_id
    WHERE ptm.project_team_member_id = LAST_INSERT_ID();
END //
DELIMITER ;

-- Update a project team member's role
DELIMITER //
CREATE PROCEDURE sp_UpdateProjectTeamMember(
    IN p_project_team_member_id INT,
    IN p_role ENUM('team_member', 'team_lead')
)
BEGIN
    -- Update the team member's role
    UPDATE project_team_members
    SET 
        role = p_role,
        updated_at = CURRENT_TIMESTAMP
    WHERE project_team_member_id = p_project_team_member_id;
    
    -- Return the updated team member
    SELECT 
        ptm.project_team_member_id,
        ptm.project_id,
        p.name AS project_name,
        ptm.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.email AS employee_email,
        e.team_id,
        t.name AS team_name,
        ptm.role,
        ptm.added_by,
        CONCAT(a.username) AS added_by_name,
        ptm.created_at,
        ptm.updated_at
    FROM project_team_members ptm
    JOIN projects p ON ptm.project_id = p.project_id
    JOIN employees e ON ptm.employee_id = e.employee_id
    LEFT JOIN teams t ON e.team_id = t.team_id
    LEFT JOIN users a ON ptm.added_by = a.user_id
    WHERE ptm.project_team_member_id = p_project_team_member_id;
END //
DELIMITER ;

-- Remove a member from a project team
DELIMITER //
CREATE PROCEDURE sp_DeleteProjectTeamMember(
    IN p_project_team_member_id INT
)
BEGIN
    DECLARE rows_affected INT;
    
    DELETE FROM project_team_members 
    WHERE project_team_member_id = p_project_team_member_id;
    
    SET rows_affected = ROW_COUNT();
    
    IF rows_affected = 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'No project team member found with the given ID';
    END IF;
    
    SELECT rows_affected AS deleted_rows;
END //
DELIMITER ;

-- Get all members of a project team
DELIMITER //
CREATE PROCEDURE sp_GetProjectTeamMembers(
    IN p_project_id INT
)
BEGIN
    SELECT 
        ptm.project_team_member_id,
        ptm.project_id,
        p.name AS project_name,
        ptm.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.email AS employee_email,
        e.team_id,
        t.name AS team_name,
        ptm.role,
        ptm.added_by,
        CONCAT(a.username) AS added_by_name,
        ptm.created_at,
        ptm.updated_at
    FROM project_team_members ptm
    JOIN projects p ON ptm.project_id = p.project_id
    JOIN employees e ON ptm.employee_id = e.employee_id
    LEFT JOIN teams t ON e.team_id = t.team_id
    LEFT JOIN users a ON ptm.added_by = a.user_id
    WHERE ptm.project_id = p_project_id
    ORDER BY ptm.role, e.first_name, e.last_name;
END //
DELIMITER ;

-- Get all projects for an employee
DELIMITER //
CREATE PROCEDURE sp_GetEmployeeProjects(
    IN p_employee_id INT
)
BEGIN
    SELECT 
        p.*,
        cc.name AS customer_company_name,
        CONCAT(e.first_name, ' ', e.last_name) AS manager_name,
        ptm.role AS member_role,
        ptm.project_team_member_id
    FROM project_team_members ptm
    JOIN projects p ON ptm.project_id = p.project_id
    LEFT JOIN customer_companies cc ON p.customer_company_id = cc.customer_company_id
    LEFT JOIN employees e ON p.project_manager_id = e.employee_id
    WHERE ptm.employee_id = p_employee_id
    ORDER BY p.created_at DESC;
END //
DELIMITER ;

-- Get team members by role
DELIMITER //
CREATE PROCEDURE sp_GetProjectTeamMembersByRole(
    IN p_project_id INT,
    IN p_role ENUM('team_member', 'team_lead')
)
BEGIN
    SELECT 
        ptm.project_team_member_id,
        ptm.project_id,
        p.name AS project_name,
        ptm.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.email AS employee_email,
        e.team_id,
        t.name AS team_name,
        ptm.role,
        ptm.added_by,
        CONCAT(a.username) AS added_by_name,
        ptm.created_at,
        ptm.updated_at
    FROM project_team_members ptm
    JOIN projects p ON ptm.project_id = p.project_id
    JOIN employees e ON ptm.employee_id = e.employee_id
    LEFT JOIN teams t ON e.team_id = t.team_id
    LEFT JOIN users a ON ptm.added_by = a.user_id
    WHERE ptm.project_id = p_project_id AND ptm.role = p_role
    ORDER BY e.first_name, e.last_name;
END //
DELIMITER ;

-- Get team members by team
DELIMITER //
CREATE PROCEDURE sp_GetProjectTeamMembersByTeam(
    IN p_project_id INT,
    IN p_team_id INT
)
BEGIN
    SELECT 
        ptm.project_team_member_id,
        ptm.project_id,
        p.name AS project_name,
        ptm.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.email AS employee_email,
        e.team_id,
        t.name AS team_name,
        ptm.role,
        ptm.added_by,
        CONCAT(a.username) AS added_by_name,
        ptm.created_at,
        ptm.updated_at
    FROM project_team_members ptm
    JOIN projects p ON ptm.project_id = p.project_id
    JOIN employees e ON ptm.employee_id = e.employee_id
    LEFT JOIN teams t ON e.team_id = t.team_id
    LEFT JOIN users a ON ptm.added_by = a.user_id
    WHERE ptm.project_id = p_project_id AND e.team_id = p_team_id
    ORDER BY ptm.role, e.first_name, e.last_name;
END //
DELIMITER ; 