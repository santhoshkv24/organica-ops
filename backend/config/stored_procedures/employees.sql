-- ============================
-- EMPLOYEES
-- ============================

-- Get all employees
CREATE PROCEDURE sp_GetAllEmployees()
BEGIN
    SELECT 
        e.*, 
        t.name AS team_name,
        b.name AS branch_name,
        EXISTS (
            SELECT 1 FROM team_leads tl 
            WHERE tl.employee_id = e.employee_id
        ) AS is_team_lead
    FROM employees e
    LEFT JOIN teams t ON e.team_id = t.team_id
    LEFT JOIN branches b ON t.branch_id = b.branch_id
    ORDER BY e.created_at DESC;
END;

-- Get employee by ID
CREATE PROCEDURE sp_GetEmployeeById(IN p_employee_id INT)
BEGIN
    SELECT 
        e.*, 
        t.name AS team_name,
        b.name AS branch_name,
        EXISTS (
            SELECT 1 FROM team_leads tl 
            WHERE tl.employee_id = e.employee_id
        ) AS is_team_lead,
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'team_lead_id', tl.team_lead_id,
                    'team_id', tl.team_id,
                    'team_name', tm.name
                )
            )
            FROM team_leads tl
            JOIN teams tm ON tl.team_id = tm.team_id
            WHERE tl.employee_id = e.employee_id
        ) AS team_lead_info
    FROM employees e
    LEFT JOIN teams t ON e.team_id = t.team_id
    LEFT JOIN branches b ON t.branch_id = b.branch_id
    WHERE e.employee_id = p_employee_id;
END;

-- Create new employee
CREATE PROCEDURE sp_CreateEmployee(
    IN p_first_name VARCHAR(255),
    IN p_last_name VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_phone VARCHAR(20),
    IN p_hire_date DATE,
    IN p_team_id INT,
    IN p_position VARCHAR(255)
)
BEGIN
    INSERT INTO employees (first_name, last_name, email, phone, hire_date, team_id, position)
    VALUES (p_first_name, p_last_name, p_email, p_phone, p_hire_date, p_team_id, p_position);

    SELECT LAST_INSERT_ID() AS employee_id;
END;

-- Update employee
CREATE PROCEDURE sp_UpdateEmployee(
    IN p_employee_id INT,
    IN p_first_name VARCHAR(255),
    IN p_last_name VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_phone VARCHAR(20),
    IN p_hire_date DATE,
    IN p_team_id INT,
    IN p_position VARCHAR(255)
)
BEGIN
    UPDATE employees
    SET first_name = p_first_name,
        last_name = p_last_name,
        email = p_email,
        phone = p_phone,
        hire_date = p_hire_date,
        team_id = p_team_id,
        position = p_position
    WHERE employee_id = p_employee_id;
END;

-- Delete employee
CREATE PROCEDURE sp_DeleteEmployee(IN p_employee_id INT)
BEGIN
    DELETE FROM employees WHERE employee_id = p_employee_id;
    SELECT ROW_COUNT() AS deleted_rows;
END;

-- Check if employee email exists
CREATE PROCEDURE sp_CheckEmployeeEmailExists(
    IN p_email VARCHAR(255),
    IN p_exclude_id INT
)
BEGIN
    IF p_exclude_id > 0 THEN
        SELECT COUNT(*) AS email_count FROM employees
        WHERE email = p_email AND employee_id != p_exclude_id;
    ELSE
        SELECT COUNT(*) AS email_count FROM employees
        WHERE email = p_email;
    END IF;
END;

CREATE PROCEDURE sp_GetEmployeesByTeam(IN p_team_id INT)
BEGIN
    SELECT 
        e.*, 
        t.name AS team_name,
        b.name AS branch_name,
        EXISTS (
            SELECT 1 FROM team_leads tl 
            WHERE tl.employee_id = e.employee_id
        ) AS is_team_lead
    FROM employees e
    LEFT JOIN teams t ON e.team_id = t.team_id
    LEFT JOIN branches b ON t.branch_id = b.branch_id
    WHERE e.team_id = p_team_id
    ORDER BY e.created_at DESC;
END;

-- Get employees by branch
CREATE PROCEDURE sp_GetEmployeesByBranch(IN p_branch_id INT)
BEGIN
    SELECT 
        e.*, 
        t.name AS team_name,
        b.name AS branch_name,
        EXISTS (
            SELECT 1 FROM team_leads tl 
            WHERE tl.employee_id = e.employee_id
        ) AS is_team_lead
    FROM employees e
    LEFT JOIN teams t ON e.team_id = t.team_id
    LEFT JOIN branches b ON t.branch_id = b.branch_id
    WHERE t.branch_id = p_branch_id
    ORDER BY e.created_at DESC;
END;