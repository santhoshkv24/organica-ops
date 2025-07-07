-- ============================
-- CUSTOMER EMPLOYEES
-- ============================

-- Get all customer employees
DELIMITER //
CREATE PROCEDURE sp_GetAllCustomerEmployees()
BEGIN
    SELECT 
        ce.*,
        cc.name AS customer_company_name,
        u.user_id IS NOT NULL AS has_user_account,
        u.role AS user_role
    FROM customer_employees ce
    JOIN customer_companies cc ON ce.customer_company_id = cc.customer_company_id
    LEFT JOIN users u ON ce.customer_employee_id = u.customer_id
    ORDER BY ce.created_at DESC;
END //
DELIMITER ;

-- Get customer employee by ID
DELIMITER //
CREATE PROCEDURE sp_GetCustomerEmployeeById(IN p_customer_employee_id INT)
BEGIN
    SELECT 
        ce.*,
        cc.name AS customer_company_name,
        u.user_id IS NOT NULL AS has_user_account,
        u.role AS user_role
    FROM customer_employees ce
    JOIN customer_companies cc ON ce.customer_company_id = cc.customer_company_id
    LEFT JOIN users u ON ce.customer_employee_id = u.customer_id
    WHERE ce.customer_employee_id = p_customer_employee_id;
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE sp_GetProjectIDByCustomerHeadId(
    IN p_customer_head_user_id INT
)
BEGIN
    SELECT p.project_id
    FROM projects p
    WHERE p.customer_company_id = (
        SELECT ce.customer_company_id
        FROM customer_employees ce
        INNER JOIN users u ON ce.customer_employee_id = u.customer_id
        WHERE u.user_id = p_customer_head_user_id
        LIMIT 1
    );
END//

DELIMITER ;

-- Get customer employees by company
DELIMITER //
CREATE PROCEDURE sp_GetCustomerEmployeesByCompany(IN p_customer_company_id INT)
BEGIN
    SELECT 
        ce.*,
        cc.name AS customer_company_name,
        u.user_id IS NOT NULL AS has_user_account,
        u.role AS user_role
    FROM customer_employees ce
    JOIN customer_companies cc ON ce.customer_company_id = cc.customer_company_id
    LEFT JOIN users u ON ce.customer_employee_id = u.customer_id
    WHERE ce.customer_company_id = p_customer_company_id
    ORDER BY ce.is_head DESC, ce.first_name, ce.last_name;
END //
DELIMITER ;

-- Get customer heads by company
DELIMITER //
CREATE PROCEDURE sp_GetCustomerHeadsByCompany(IN p_customer_company_id INT)
BEGIN
    SELECT 
        ce.*,
        cc.name AS customer_company_name,
        u.user_id IS NOT NULL AS has_user_account,
        u.role AS user_role
    FROM customer_employees ce
    JOIN customer_companies cc ON ce.customer_company_id = cc.customer_company_id
    LEFT JOIN users u ON ce.customer_employee_id = u.customer_id
    WHERE ce.customer_company_id = p_customer_company_id
    AND ce.is_head = TRUE
    ORDER BY ce.first_name, ce.last_name;
END //
DELIMITER ;

-- Get customer employees by project (filtered by project's customer company)
DELIMITER //
CREATE PROCEDURE sp_GetCustomerEmployeesByProject(IN p_project_id INT)
BEGIN
    DECLARE v_customer_company_id INT;
    
    -- Get the customer company ID for the project
    SELECT customer_company_id INTO v_customer_company_id
    FROM projects
    WHERE project_id = p_project_id;
    
    IF v_customer_company_id IS NULL THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Project not found or does not have an associated customer company';
    END IF;
    
    -- Return all customer employees for the project's customer company
    SELECT 
        ce.*,
        cc.name AS customer_company_name,
        u.user_id IS NOT NULL AS has_user_account,
        u.role AS user_role
    FROM customer_employees ce
    JOIN customer_companies cc ON ce.customer_company_id = cc.customer_company_id
    LEFT JOIN users u ON ce.customer_employee_id = u.customer_id
    WHERE ce.customer_company_id = v_customer_company_id
    ORDER BY ce.is_head DESC, ce.first_name, ce.last_name;
END //
DELIMITER ;

-- Get customer heads by project (filtered by project's customer company)
DELIMITER //
CREATE PROCEDURE sp_GetCustomerHeadsByProject(IN p_project_id INT)
BEGIN
    DECLARE v_customer_company_id INT;
    
    -- Get the customer company ID for the project
    SELECT customer_company_id INTO v_customer_company_id
    FROM projects
    WHERE project_id = p_project_id;
    
    IF v_customer_company_id IS NULL THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Project not found or does not have an associated customer company';
    END IF;
    
    -- Return only customer heads for the project's customer company
    SELECT 
        ce.*,
        cc.name AS customer_company_name,
        u.user_id IS NOT NULL AS has_user_account,
        u.role AS user_role
    FROM customer_employees ce
    JOIN customer_companies cc ON ce.customer_company_id = cc.customer_company_id
    LEFT JOIN users u ON ce.customer_employee_id = u.customer_id
    WHERE ce.customer_company_id = v_customer_company_id
    AND ce.is_head = TRUE
    ORDER BY ce.first_name, ce.last_name;
END //
DELIMITER ;



-- Add this to customer_employees.sql
DELIMITER //
CREATE PROCEDURE sp_UpdateCustomerEmployeeWithUser(
    IN p_customer_employee_id INT,
    IN p_first_name VARCHAR(255),
    IN p_last_name VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_phone VARCHAR(20),
    IN p_position VARCHAR(255),
    IN p_is_head BOOLEAN,
    IN p_updated_by INT
)
BEGIN
    DECLARE v_old_email VARCHAR(255);
    DECLARE v_user_id INT;
    DECLARE v_role VARCHAR(50);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Get current email and user_id
    SELECT email, user_id INTO v_old_email, v_user_id
    FROM customer_employees
    WHERE customer_employee_id = p_customer_employee_id;
    
    IF v_old_email IS NULL THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Customer employee not found';
    END IF;
    
    -- Check if new email is already in use
    IF p_email != v_old_email AND EXISTS (
        SELECT 1 FROM customer_employees 
        WHERE email = p_email 
        AND customer_employee_id != p_customer_employee_id
    ) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Email already in use by another employee';
    END IF;
    
    -- Set role based on is_head flag
    IF p_is_head THEN
        SET v_role = 'customer_head';
    ELSE
        SET v_role = 'customer_employee';
    END IF;
    
    -- Update customer employee
    UPDATE customer_employees
    SET 
        first_name = p_first_name,
        last_name = p_last_name,
        email = p_email,
        phone = p_phone,
        position = p_position,
        is_head = p_is_head,
        updated_by = p_updated_by,
        updated_at = NOW()
    WHERE customer_employee_id = p_customer_employee_id;
    
    -- Update user account if it exists
    IF v_user_id IS NOT NULL THEN
        UPDATE users
        SET 
            email = p_email,
            role = v_role,
            updated_at = NOW()
        WHERE user_id = v_user_id;
    END IF;
    
    COMMIT;
    
    -- Return the updated employee with user info
    SELECT 
        ce.*,
        u.user_id,
        u.username,
        u.role
    FROM customer_employees ce
    LEFT JOIN users u ON ce.user_id = u.user_id
    WHERE ce.customer_employee_id = p_customer_employee_id;
END //

-- Get customer employees with user status (simplified version without users table join)
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_GetCustomerEmployeesWithUserStatus(
    IN p_customer_company_id INT
)
BEGIN
    SELECT 
        customer_employee_id,
        first_name,
        last_name,
        email,
        phone,
        position,
        is_head,
        created_at,
        updated_at,
        1 AS has_user_account  -- Assuming all customer employees have user accounts
    FROM customer_employees
    WHERE customer_company_id = p_customer_company_id
    ORDER BY is_head DESC, first_name, last_name;
END //

-- Create customer employee with user account
CREATE PROCEDURE IF NOT EXISTS sp_CreateCustomerEmployeeWithUser(
    IN p_customer_company_id INT,
    IN p_first_name VARCHAR(255),
    IN p_last_name VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_phone VARCHAR(20),
    IN p_position VARCHAR(255),
    IN p_is_head BOOLEAN,
    IN p_added_by INT
)
BEGIN
    DECLARE v_user_id INT;
    DECLARE v_username VARCHAR(100);
    DECLARE v_password VARCHAR(255);
    DECLARE v_role VARCHAR(20);
    DECLARE v_customer_employee_id INT;
    
    -- Generate username (firstname.lastname in lowercase, replace spaces with dots)
    SET v_username = LOWER(CONCAT(REPLACE(p_first_name, ' ', '.'), '.', REPLACE(p_last_name, ' ', '.')));
    
    -- Use phone number as password (hashed)
    SET v_password = SHA2(p_phone, 256);
    
    -- Set role based on is_head flag
    IF p_is_head = 1 THEN
        SET v_role = 'customer_head';
    ELSE
        SET v_role = 'customer_employee';
    END IF;
    
    -- First create the customer employee
    INSERT INTO customer_employees (
        customer_company_id,
        first_name,
        last_name,
        email,
        phone,
        position,
        is_head,
        created_at,
        updated_at
    ) VALUES (
        p_customer_company_id,
        p_first_name,
        p_last_name,
        p_email,
        p_phone,
        p_position,
        p_is_head,
        NOW(),
        NOW()
    );
    
    SET v_customer_employee_id = LAST_INSERT_ID();
    
    -- Then create the user account
    INSERT INTO users (
        username,
        email,
        password,
        role,
        customer_id,
        created_at,
        updated_at
    ) VALUES (
        v_username,
        p_email,
        v_password,
        v_role,
        v_customer_employee_id,
        NOW(),
        NOW()
    );
    
    SET v_user_id = LAST_INSERT_ID();
    
    -- Update the customer_employee with the user_id (if needed)
    -- Note: This is only if you have a user_id column in customer_employees
    -- If not, you can remove this part
    -- UPDATE customer_employees 
    -- SET user_id = v_user_id 
    -- WHERE customer_employee_id = v_customer_employee_id;
    
    -- Return the created employee with user info
    SELECT 
        ce.*,
        v_username as username,
        p_phone as temp_password
    FROM customer_employees ce
    WHERE ce.customer_employee_id = v_customer_employee_id;
END //

-- Update customer employee
CREATE PROCEDURE IF NOT EXISTS sp_UpdateCustomerEmployee(
    IN p_customer_employee_id INT,
    IN p_first_name VARCHAR(255),
    IN p_last_name VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_phone VARCHAR(20),
    IN p_position VARCHAR(255),
    IN p_is_head BOOLEAN
)
BEGIN
    UPDATE customer_employees
    SET 
        first_name = p_first_name,
        last_name = p_last_name,
        email = p_email,
        phone = p_phone,
        position = p_position,
        is_head = p_is_head,
        updated_at = NOW()
    WHERE customer_employee_id = p_customer_employee_id;
    
    -- Return the updated employee
    SELECT * FROM customer_employees WHERE customer_employee_id = p_customer_employee_id;
END //

CREATE PROCEDURE sp_DeleteCustomerEmployee(IN p_customer_employee_id INT)
BEGIN
    DELETE FROM customer_employees
    WHERE customer_employee_id = p_customer_employee_id;

    SELECT ROW_COUNT() AS deleted_rows;
END //

DELIMITER ; 