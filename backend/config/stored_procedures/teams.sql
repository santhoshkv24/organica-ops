-- ============================
-- TEAMS
-- ============================

-- Get all teams
CREATE PROCEDURE sp_GetAllTeams()
BEGIN
    SELECT
        t.*,
        b.name AS branch_name,
        (SELECT COUNT(*) FROM employees WHERE team_id = t.team_id) AS employee_count
    FROM teams t
    LEFT JOIN branches b ON t.branch_id = b.branch_id
    ORDER BY t.created_at DESC;
END;

-- Get team by ID
CREATE PROCEDURE sp_GetTeamById(IN p_team_id INT)
BEGIN
    SELECT
        t.*,
        b.name AS branch_name,
        (SELECT COUNT(*) FROM employees WHERE team_id = t.team_id) AS employee_count
    FROM teams t
    LEFT JOIN branches b ON t.branch_id = b.branch_id
    WHERE t.team_id = p_team_id;
END;

-- Create new team
CREATE PROCEDURE sp_CreateTeam(
    IN p_name VARCHAR(255),
    IN p_branch_id INT,
    IN p_description TEXT
)
BEGIN
    INSERT INTO teams (name, branch_id, description)
    VALUES (p_name, p_branch_id, p_description);

    SELECT LAST_INSERT_ID() AS team_id;
END;

-- Update team
CREATE PROCEDURE sp_UpdateTeam(
    IN p_team_id INT,
    IN p_name VARCHAR(255),
    IN p_branch_id INT,
    IN p_description TEXT
)
BEGIN
    UPDATE teams
    SET name = p_name,
        branch_id = p_branch_id,
        description = p_description
    WHERE team_id = p_team_id;
END;

-- Delete team
CREATE PROCEDURE sp_DeleteTeam(IN p_team_id INT)
BEGIN
    DELETE FROM teams WHERE team_id = p_team_id;
    SELECT ROW_COUNT() AS deleted_rows;
END;

-- Check if team name exists
CREATE PROCEDURE sp_CheckTeamNameExists(
    IN p_name VARCHAR(255),
    IN p_branch_id INT,
    IN p_exclude_id INT
)
BEGIN
    IF p_exclude_id > 0 THEN
        SELECT COUNT(*) AS name_count FROM teams
        WHERE name = p_name AND branch_id = p_branch_id AND team_id != p_exclude_id;
    ELSE
        SELECT COUNT(*) AS name_count FROM teams
        WHERE name = p_name AND branch_id = p_branch_id;
    END IF;
END;

-- Count team dependencies
CREATE PROCEDURE sp_CountTeamDependencies(IN p_team_id INT)
BEGIN
    SELECT COUNT(*) AS count FROM employees WHERE team_id = p_team_id;
END;

-- Team Lead Management
CREATE PROCEDURE sp_AssignTeamLead(
    IN p_employee_id INT,
    IN p_team_id INT,
    IN p_assigned_by INT
)
BEGIN
    -- Check if employee is already a team lead for this team
    IF EXISTS (SELECT 1 FROM team_leads WHERE employee_id = p_employee_id AND team_id = p_team_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This employee is already a team lead for this team';
    ELSE
        -- Check if employee is part of the team
        IF EXISTS (SELECT 1 FROM employees WHERE employee_id = p_employee_id AND team_id = p_team_id) THEN
            INSERT INTO team_leads (employee_id, team_id, assigned_by)
            VALUES (p_employee_id, p_team_id, p_assigned_by);
            
            -- Update user role to team_lead if not already
            UPDATE users u
            JOIN employees e ON u.employee_id = e.employee_id
            SET u.role = 'team_lead'
            WHERE e.employee_id = p_employee_id AND u.role != 'admin' AND u.role != 'manager';
            
            SELECT LAST_INSERT_ID() AS team_lead_id;
        ELSE
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Employee is not a member of this team';
        END IF;
    END IF;
END;

CREATE PROCEDURE sp_GetTeamLeadsByTeam(IN p_team_id INT)
BEGIN
    SELECT 
        tl.team_lead_id,
        tl.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.email,
        e.phone,
        tl.assigned_at,
        CONCAT(a.first_name, ' ', a.last_name) AS assigned_by_name
    FROM team_leads tl
    JOIN employees e ON tl.employee_id = e.employee_id
    LEFT JOIN employees a ON tl.assigned_by = a.employee_id
    WHERE tl.team_id = p_team_id
    ORDER BY tl.assigned_at DESC;
END;

CREATE PROCEDURE sp_GetTeamLeadTeams(IN p_employee_id INT)
BEGIN
    -- First result set: Teams the employee leads
    SELECT 
        t.*,
        b.name AS branch_name,
        tl.assigned_at
    FROM team_leads tl
    JOIN teams t ON tl.team_id = t.team_id
    LEFT JOIN branches b ON t.branch_id = b.branch_id
    WHERE tl.employee_id = p_employee_id;
    
    -- Second result set: Projects associated with those teams
    SELECT 
        t.team_id,
        p.project_id,
        p.name AS project_name,
        p.description,
        p.status,
        p.start_date,
        p.end_date,
        ptm.project_team_member_id
    FROM team_leads tl
    JOIN teams t ON tl.team_id = t.team_id
    JOIN employees e ON e.team_id = t.team_id
    JOIN project_team_members ptm ON ptm.employee_id = e.employee_id
    JOIN projects p ON ptm.project_id = p.project_id
    WHERE tl.employee_id = p_employee_id;
END;

CREATE PROCEDURE sp_RemoveTeamLead(IN p_team_lead_id INT)
BEGIN
    DECLARE v_employee_id INT;
    DECLARE v_team_count INT;
    
    -- Get the employee ID before deleting
    SELECT employee_id INTO v_employee_id 
    FROM team_leads 
    WHERE team_lead_id = p_team_lead_id;
    
    -- Delete the team lead assignment
    DELETE FROM team_leads WHERE team_lead_id = p_team_lead_id;
    
    -- Check if the employee is still a team lead for any other teams
    SELECT COUNT(*) INTO v_team_count 
    FROM team_leads 
    WHERE employee_id = v_employee_id;
    
    -- If not a team lead for any team anymore, update role to employee
    IF v_team_count = 0 THEN
        UPDATE users 
        SET role = 'employee' 
        WHERE employee_id = v_employee_id 
        AND role = 'team_lead';
    END IF;
    
    SELECT ROW_COUNT() AS affected_rows;
END;

-- Check if a user is a team lead and get their team assignments
CREATE PROCEDURE sp_IsUserTeamLead(IN p_employee_id INT)
BEGIN
    SELECT 
        COUNT(*) > 0 AS is_team_lead,
        IFNULL(GROUP_CONCAT(team_id), '') AS team_ids
    FROM team_leads 
    WHERE employee_id = p_employee_id
    GROUP BY employee_id;
END;

-- Get teams by branch
CREATE PROCEDURE sp_GetTeamsByBranch(IN p_branch_id INT)
BEGIN
    SELECT
        t.*,
        b.name AS branch_name,
        (SELECT COUNT(*) FROM employees WHERE team_id = t.team_id) AS employee_count
    FROM teams t
    LEFT JOIN branches b ON t.branch_id = b.branch_id
    WHERE t.branch_id = p_branch_id
    ORDER BY t.name ASC;
END;