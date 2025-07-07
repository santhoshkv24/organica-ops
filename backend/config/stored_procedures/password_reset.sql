-- ============================
-- PASSWORD RESET
-- ============================

-- Add columns for password reset to users table
ALTER TABLE users
ADD COLUMN password_reset_token VARCHAR(255) DEFAULT NULL,
ADD COLUMN password_reset_expires TIMESTAMP DEFAULT NULL;


-- Set password reset token
CREATE PROCEDURE sp_SetPasswordResetToken(
    IN p_user_id INT,
    IN p_token VARCHAR(255),
    IN p_expires TIMESTAMP
)
BEGIN
    UPDATE users
    SET password_reset_token = p_token,
        password_reset_expires = p_expires
    WHERE user_id = p_user_id;
END;

-- Get user by reset token
CREATE PROCEDURE sp_GetUserByResetToken(IN p_token VARCHAR(255))
BEGIN
    SELECT *
    FROM users
    WHERE password_reset_token = p_token AND password_reset_expires > NOW();
END;
