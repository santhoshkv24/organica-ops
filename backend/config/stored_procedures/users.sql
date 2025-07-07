-- ============================
-- USERS
-- ============================

-- Get all users
CREATE PROCEDURE sp_GetAllUsers()
BEGIN
    SELECT user_id, employee_id, username, email, role, last_login, created_at, updated_at
    FROM users
    ORDER BY created_at DESC;
END;

-- Get user by ID
CREATE PROCEDURE sp_GetUserById(IN p_user_id INT)
BEGIN
    SELECT 
        u.user_id, 
        u.username, 
        u.email, 
        u.role, 
        u.employee_id, 
        u.profile_picture, 
        u.last_login, 
        u.created_at, 
        u.updated_at,
        EXISTS (
            SELECT 1 FROM team_leads tl 
            WHERE tl.employee_id = u.employee_id
        ) AS is_team_lead,
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'team_lead_id', tl.team_lead_id,
                    'team_id', tl.team_id,
                    'team_name', t.name
                )
            )
            FROM team_leads tl
            JOIN teams t ON tl.team_id = t.team_id
            WHERE tl.employee_id = u.employee_id
        ) AS team_lead_info
    FROM users u
    WHERE u.user_id = p_user_id;
END;

-- Get user by email
CREATE PROCEDURE sp_GetUserByEmail(IN p_email VARCHAR(255))
BEGIN
    SELECT * FROM users WHERE email = p_email;
END;

-- Create new user
CREATE PROCEDURE sp_CreateUser(
    IN p_username VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_password VARCHAR(255),
    IN p_role ENUM('admin', 'manager', 'team_lead', 'employee', 'customer_head', 'customer_employee'),
    IN p_employee_id INT
)
BEGIN
    INSERT INTO users (username, email, password, role, employee_id)
    VALUES (p_username, p_email, p_password, p_role, p_employee_id);

    SELECT LAST_INSERT_ID() AS user_id;
END;

-- Update user
CREATE PROCEDURE sp_UpdateUser(
    IN p_user_id INT,
    IN p_username VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_role ENUM('admin', 'manager', 'team_lead', 'employee', 'customer_head', 'customer_employee'),
    IN p_employee_id INT
)
BEGIN
    UPDATE users
    SET username = p_username,
        email = p_email,
        role = p_role,
        employee_id = p_employee_id
    WHERE user_id = p_user_id;
END;

-- Update user password
CREATE PROCEDURE sp_UpdateUserPassword(
    IN p_user_id INT,
    IN p_password VARCHAR(255)
)
BEGIN
    UPDATE users
    SET password = p_password
    WHERE user_id = p_user_id;
END;

-- Update user last login
CREATE PROCEDURE sp_UpdateUserLastLogin(IN p_user_id INT)
BEGIN
    UPDATE users SET last_login = NOW() WHERE user_id = p_user_id;
END;

-- Delete user
CREATE PROCEDURE sp_DeleteUser(IN p_user_id INT)
BEGIN
    DELETE FROM users WHERE user_id = p_user_id;
    SELECT ROW_COUNT() AS deleted_rows;
END;

-- Check if username/email exists
CREATE PROCEDURE sp_CheckUserExists(
    IN p_email VARCHAR(255),
    IN p_exclude_id INT
)
BEGIN
    IF p_exclude_id > 0 THEN
        SELECT COUNT(*) AS email_count FROM users
        WHERE email = p_email AND user_id != p_exclude_id;
    ELSE
        SELECT COUNT(*) AS email_count FROM users
        WHERE email = p_email;
    END IF;
END;

-- Update user profile picture
CREATE PROCEDURE sp_UpdateUserProfilePicture(
    IN p_user_id INT,
    IN p_profile_picture VARCHAR(255)
)
BEGIN
    UPDATE users
    SET profile_picture = p_profile_picture
    WHERE user_id = p_user_id;
END;

-- Get user by employee ID
CREATE PROCEDURE sp_GetUserByEmployeeId(IN p_employee_id INT)
BEGIN
    SELECT 
        u.*,
        EXISTS (
            SELECT 1 FROM team_leads tl 
            WHERE tl.employee_id = u.employee_id
        ) AS is_team_lead,
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'team_lead_id', tl.team_lead_id,
                    'team_id', tl.team_id,
                    'team_name', t.name
                )
            )
            FROM team_leads tl
            JOIN teams t ON tl.team_id = t.team_id
            WHERE tl.employee_id = u.employee_id
        ) AS team_lead_info
    FROM users u
    WHERE u.employee_id = p_employee_id;
END;