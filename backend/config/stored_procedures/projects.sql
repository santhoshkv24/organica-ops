-- ============================
-- PROJECTS
-- ============================

-- Get all projects
DELIMITER //
CREATE PROCEDURE sp_GetAllProjects()
BEGIN
    SELECT 
        p.*,
        cc.name AS customer_company_name,
        CONCAT(e.first_name, ' ', e.last_name) AS manager_name,
        e.email AS manager_email,
        (
            SELECT COUNT(*) 
            FROM project_team_members 
            WHERE project_id = p.project_id
        ) AS team_member_count
    FROM projects p
    LEFT JOIN customer_companies cc ON p.customer_company_id = cc.customer_company_id
    LEFT JOIN employees e ON p.project_manager_id = e.employee_id
    ORDER BY p.created_at DESC;
END //
DELIMITER ;

-- Get project by ID
DELIMITER //
CREATE PROCEDURE sp_GetProjectById(IN p_project_id INT)
BEGIN
    -- Get project details
    SELECT 
        p.*,
        cc.name AS customer_company_name,
        CONCAT(e.first_name, ' ', e.last_name) AS manager_name,
        e.email AS manager_email
    FROM projects p
    LEFT JOIN customer_companies cc ON p.customer_company_id = cc.customer_company_id
    LEFT JOIN employees e ON p.project_manager_id = e.employee_id
    WHERE p.project_id = p_project_id;
    
    -- Get project team members
    SELECT 
        ptm.project_team_member_id,
        ptm.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.email AS employee_email,
        e.team_id,
        t.name AS team_name,
        ptm.role,
        ptm.added_by,
        CONCAT(a.first_name, ' ', a.last_name) AS added_by_name,
        ptm.created_at
    FROM project_team_members ptm
    JOIN employees e ON ptm.employee_id = e.employee_id
    LEFT JOIN teams t ON e.team_id = t.team_id
    LEFT JOIN employees a ON ptm.added_by = a.employee_id
    WHERE ptm.project_id = p_project_id
    ORDER BY ptm.role, e.first_name, e.last_name;
END //
DELIMITER ;

-- Create new project
DELIMITER //
CREATE PROCEDURE sp_CreateProject(
    IN p_name VARCHAR(255),
    IN p_customer_company_id INT,
    IN p_project_manager_id INT,
    IN p_description TEXT,
    IN p_status VARCHAR(50),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_budget DECIMAL(15,2)
)
BEGIN
    DECLARE v_project_id INT;
    
    -- Insert the new project
    INSERT INTO projects (
        name, 
        customer_company_id, 
        project_manager_id, 
        description,
        status, 
        start_date, 
        end_date,
        budget
    ) VALUES (
        p_name,
        p_customer_company_id,
        p_project_manager_id,
        p_description,
        p_status,
        p_start_date,
        p_end_date,
        p_budget
    );
    
    -- Get the new project ID
    SET v_project_id = LAST_INSERT_ID();
    
    -- Return the new project
    CALL sp_GetProjectById(v_project_id);
END //
DELIMITER ;

-- Update project
DELIMITER //
CREATE PROCEDURE sp_UpdateProject(
    IN p_project_id INT,
    IN p_name VARCHAR(255),
    IN p_customer_company_id INT,
    IN p_project_manager_id INT,
    IN p_description TEXT,
    IN p_status VARCHAR(50),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_budget DECIMAL(15,2)
)
BEGIN
    -- Update project details
    UPDATE projects
    SET 
        name = p_name,
        customer_company_id = p_customer_company_id,
        project_manager_id = p_project_manager_id,
        description = p_description,
        status = p_status,
        start_date = p_start_date,
        end_date = p_end_date,
        budget = p_budget,
        updated_at = CURRENT_TIMESTAMP
    WHERE project_id = p_project_id;
    
    -- Return the updated project
    CALL sp_GetProjectById(p_project_id);
END //
DELIMITER ;

-- Delete project
DELIMITER //
CREATE PROCEDURE sp_DeleteProject(IN p_project_id INT)
BEGIN
    DELETE FROM projects WHERE project_id = p_project_id;
    SELECT ROW_COUNT() AS deleted_rows;
END //
DELIMITER ;

-- Get projects by manager
DELIMITER //
CREATE PROCEDURE sp_GetProjectsByManager(IN p_manager_id INT)
BEGIN
    SELECT 
        p.*,
        cc.name AS customer_company_name,
        (
            SELECT COUNT(*) 
            FROM project_team_members 
            WHERE project_id = p.project_id
        ) AS team_member_count
    FROM projects p
    LEFT JOIN customer_companies cc ON p.customer_company_id = cc.customer_company_id
    WHERE p.project_manager_id = p_manager_id
    ORDER BY p.created_at DESC;
END //
DELIMITER ;

-- Get projects by team member
DELIMITER //
CREATE PROCEDURE sp_GetProjectsByTeamMember(IN p_employee_id INT)
BEGIN
    SELECT 
        p.*,
        cc.name AS customer_company_name,
        CONCAT(e.first_name, ' ', e.last_name) AS manager_name,
        ptm.role AS member_role
    FROM projects p
    JOIN project_team_members ptm ON p.project_id = ptm.project_id
    LEFT JOIN customer_companies cc ON p.customer_company_id = cc.customer_company_id
    LEFT JOIN employees e ON p.project_manager_id = e.employee_id
    WHERE ptm.employee_id = p_employee_id
    ORDER BY p.created_at DESC;
END //

DELIMITER //

CREATE PROCEDURE sp_GetProjectsByTeam(
    IN p_team_id INT
)
BEGIN
    SELECT 
        p.project_id,
        p.name as project_name,
        p.description,
        p.start_date,
        p.end_date,
        p.status,
        p.created_at,
        p.updated_at
    FROM projects p
    JOIN project_team_members pt ON p.project_id = pt.project_id
    WHERE p.status = 'Active';
END //

DELIMITER ;

-- Get projects for a team lead
DELIMITER //
CREATE PROCEDURE sp_GetTeamLeadProjects(
    IN p_team_lead_id INT
)
BEGIN
    -- Get all teams that this employee is a team lead for
    DECLARE team_count INT;
    
    SELECT COUNT(*) INTO team_count
    FROM team_leads tl
    WHERE tl.employee_id = p_team_lead_id;
    
    -- If employee is a team lead
    IF team_count > 0 THEN
        SELECT DISTINCT
            p.*,
            cc.name AS customer_company_name,
            CONCAT(e.first_name, ' ', e.last_name) AS manager_name,
            e.email AS manager_email,
            (
                SELECT COUNT(*) 
                FROM project_team_members 
                WHERE project_id = p.project_id
            ) AS team_member_count
        FROM projects p
        JOIN project_team_members ptm ON p.project_id = ptm.project_id
        JOIN employees emp ON ptm.employee_id = emp.employee_id
        JOIN team_leads tl ON emp.team_id = tl.team_id
        LEFT JOIN customer_companies cc ON p.customer_company_id = cc.customer_company_id
        LEFT JOIN employees e ON p.project_manager_id = e.employee_id
        WHERE tl.employee_id = p_team_lead_id
        ORDER BY p.created_at DESC;
    ELSE
        -- If not a team lead, return an empty result set
        SELECT 
            NULL AS project_id,
            NULL AS name,
            NULL AS customer_company_id,
            NULL AS customer_company_name,
            NULL AS project_manager_id,
            NULL AS manager_name,
            NULL AS manager_email,
            NULL AS description,
            NULL AS status,
            NULL AS start_date,
            NULL AS end_date,
            NULL AS budget,
            NULL AS created_at,
            NULL AS updated_at,
            NULL AS team_member_count
        WHERE 1 = 0;  -- This ensures no rows are returned
    END IF;
END //
DELIMITER ;