-- ============================
-- BRANCHES (formerly COMPANIES)
-- ============================

-- Get all branches
CREATE PROCEDURE sp_GetAllBranches()
BEGIN
    SELECT * FROM branches ORDER BY created_at DESC;
END;

-- Get branch by ID
CREATE PROCEDURE sp_GetBranchById(IN p_branch_id INT)
BEGIN
    SELECT * FROM branches WHERE branch_id = p_branch_id;
END;

-- Create new branch
CREATE PROCEDURE sp_CreateBranch(
    IN p_name VARCHAR(255),
    IN p_address TEXT,
    IN p_contact_email VARCHAR(255),
    IN p_contact_phone VARCHAR(20)
)
BEGIN
    INSERT INTO branches (name, address, contact_email, contact_phone)
    VALUES (p_name, p_address, p_contact_email, p_contact_phone);

    SELECT LAST_INSERT_ID() AS branch_id;
END;

-- Update branch
CREATE PROCEDURE sp_UpdateBranch(
    IN p_branch_id INT,
    IN p_name VARCHAR(255),
    IN p_address TEXT,
    IN p_contact_email VARCHAR(255),
    IN p_contact_phone VARCHAR(20)
)
BEGIN
    UPDATE branches
    SET name = p_name,
        address = p_address,
        contact_email = p_contact_email,
        contact_phone = p_contact_phone
    WHERE branch_id = p_branch_id;
END;

-- Delete branch
CREATE PROCEDURE sp_DeleteBranch(IN p_branch_id INT)
BEGIN
    DELETE FROM branches WHERE branch_id = p_branch_id;
    SELECT ROW_COUNT() AS deleted_rows;
END;

-- Check if branch name exists
CREATE PROCEDURE sp_CheckBranchNameExists(
    IN p_name VARCHAR(255),
    IN p_exclude_id INT
)
BEGIN
    IF p_exclude_id > 0 THEN
        SELECT COUNT(*) AS name_count FROM branches
        WHERE name = p_name AND branch_id != p_exclude_id;
    ELSE
        SELECT COUNT(*) AS name_count FROM branches
        WHERE name = p_name;
    END IF;
END;

-- Count branch dependencies
CREATE PROCEDURE sp_CountBranchDependencies(IN p_branch_id INT)
BEGIN
    SELECT COUNT(*) AS count FROM teams WHERE branch_id = p_branch_id;
END;