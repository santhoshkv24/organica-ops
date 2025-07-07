
DELIMITER //
CREATE PROCEDURE sp_CreateFullCustomerUser(
    IN p_customer_company_id INT,
    IN p_first_name VARCHAR(255),
    IN p_last_name VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_phone VARCHAR(20),
    IN p_position VARCHAR(255),
    IN p_is_head BOOLEAN,
    IN p_created_by INT
)
BEGIN
    
    DECLARE v_customer_employee_id INT;
    DECLARE v_username VARCHAR(255);
    DECLARE v_password VARCHAR(255);
    DECLARE v_role VARCHAR(50);
    DECLARE v_user_id INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    
    
    -- Set role based on is_head flag
    IF p_is_head THEN
        SET v_role = 'customer_head';
    ELSE
        SET v_role = 'customer_employee';
    END IF;
    
    -- Generate username and password
    SET v_username = LOWER(CONCAT(SUBSTRING(p_first_name, 1, 1), p_last_name));
    SET v_password = p_phone; -- Using phone as initial password
    
    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM customer_employees WHERE email = p_email) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Email already exists in customer_employees';
    END IF;
    
    -- Create customer employee
    INSERT INTO customer_employees (
        customer_company_id,
        first_name,
        last_name,
        email,
        phone,
        position,
        is_head
    ) VALUES (
        p_customer_company_id,
        p_first_name,
        p_last_name,
        p_email,
        p_phone,
        p_position,
        p_is_head
    );
    
    SET v_customer_employee_id = LAST_INSERT_ID();
    
    -- Create user account
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
        v_password, -- In production, this should be hashed
        v_role,
        v_customer_employee_id,
        NOW(),
        NOW()
    );
    
    SET v_user_id = LAST_INSERT_ID();
    
    COMMIT;
    
    -- Return the created employee with user info
    SELECT 
        ce.*,
        u.user_id,
        u.username,
        u.role
    FROM customer_employees ce
    LEFT JOIN users u ON ce.user_id = u.user_id
    WHERE ce.customer_employee_id = v_customer_employee_id;
END //
DELIMITER ;
