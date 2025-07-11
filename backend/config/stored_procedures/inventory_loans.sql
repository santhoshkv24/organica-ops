-- ============================
-- INVENTORY LOAN MANAGEMENT SPs
-- ============================

-- 1. Create Inventory Loan
DELIMITER //
CREATE PROCEDURE sp_CreateInventoryLoan(
    IN p_project_id INT,
    IN p_requested_by_user_id INT,
    IN p_responsible_team_id INT,
    IN p_expected_return_date DATE,
    IN p_purpose TEXT,
    IN p_items_json TEXT -- JSON array: [{item_name, quantity_requested}]
)
BEGIN
    DECLARE v_loan_id INT;
    -- Insert into inventory_loans
    INSERT INTO inventory_loans (
        project_id, requested_by_user_id, responsible_team_id, expected_return_date, purpose
    ) VALUES (
        p_project_id, p_requested_by_user_id, p_responsible_team_id, p_expected_return_date, p_purpose
    );
    SET v_loan_id = LAST_INSERT_ID();
    -- Insert items
    CALL sp_BulkInsertInventoryLoanItems(v_loan_id, p_items_json);
    SELECT v_loan_id AS loan_id;
END //
DELIMITER ;

-- 2. Bulk Insert Inventory Loan Items (helper)
DELIMITER //
CREATE PROCEDURE sp_BulkInsertInventoryLoanItems(
    IN p_loan_id INT,
    IN p_items_json TEXT
)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE n INT;
    SET n = JSON_LENGTH(p_items_json);
    WHILE i < n DO
        INSERT INTO inventory_loan_items (loan_id, item_name, quantity_requested)
        VALUES (
            p_loan_id,
            JSON_UNQUOTE(JSON_EXTRACT(p_items_json, CONCAT('$[', i, '].item_name'))),
            JSON_EXTRACT(p_items_json, CONCAT('$[', i, '].quantity_requested'))
        );
        SET i = i + 1;
    END WHILE;
END //
DELIMITER ;

-- 3. Approve/Reject Loan
DELIMITER //
CREATE PROCEDURE sp_ApproveRejectInventoryLoan(
    IN p_loan_id INT,
    IN p_status ENUM('Approved','Rejected'),
    IN p_approved_by_user_id INT
)
BEGIN
    UPDATE inventory_loans
    SET status = p_status,
        approved_by_user_id = p_approved_by_user_id,
        approval_date = IF(p_status = 'Approved', CURRENT_TIMESTAMP, approval_date)
    WHERE loan_id = p_loan_id;
END //
DELIMITER ;

-- 4. Assign & Issue Items
DELIMITER //
CREATE PROCEDURE sp_IssueInventoryLoan(
    IN p_loan_id INT,
    IN p_issued_by_user_id INT,
    IN p_items_json TEXT -- JSON array: [{loan_item_id, quantity_issued}]
)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE n INT;
    UPDATE inventory_loans
    SET status = 'Issued',
        issued_by_user_id = p_issued_by_user_id,
        issued_date = CURRENT_TIMESTAMP
    WHERE loan_id = p_loan_id;
    -- Update issued quantities
    
    SET n = JSON_LENGTH(p_items_json);
    WHILE i < n DO
        UPDATE inventory_loan_items
        SET quantity_issued = JSON_EXTRACT(p_items_json, CONCAT('$[', i, '].quantity_issued'))
        WHERE loan_item_id = JSON_EXTRACT(p_items_json, CONCAT('$[', i, '].loan_item_id'));
        SET i = i + 1;
    END WHILE;
END //
DELIMITER ;

-- 5. Update Returns
DELIMITER //
CREATE PROCEDURE sp_ReturnInventoryLoanItems(
    IN p_loan_id INT,
    IN p_items_json TEXT -- JSON array: [{loan_item_id, quantity_returned}]
)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE v_total_issued INT;
    DECLARE v_total_returned INT;
    DECLARE v_current_returned INT;
    DECLARE v_new_returned INT;
    DECLARE v_loan_item_id INT;
    DECLARE n INT;
    SET n = JSON_LENGTH(p_items_json);
    
    -- Update each item's returned quantity
    WHILE i < n DO
        SET v_loan_item_id = JSON_EXTRACT(p_items_json, CONCAT('$[', i, '].loan_item_id'));
        SET v_new_returned = JSON_EXTRACT(p_items_json, CONCAT('$[', i, '].quantity_returned'));
        
        -- Get current returned quantity
        SELECT quantity_returned INTO v_current_returned 
        FROM inventory_loan_items 
        WHERE loan_item_id = v_loan_item_id;
        
        -- Add the new returned quantity to existing returned quantity
        UPDATE inventory_loan_items
        SET quantity_returned = COALESCE(v_current_returned, 0) + v_new_returned
        WHERE loan_item_id = v_loan_item_id;
        
        SET i = i + 1;
    END WHILE;
    
    -- Check totals and update loan status
    SELECT SUM(quantity_issued) INTO v_total_issued FROM inventory_loan_items WHERE loan_id = p_loan_id;
    SELECT SUM(quantity_returned) INTO v_total_returned FROM inventory_loan_items WHERE loan_id = p_loan_id;
    
    IF v_total_returned < v_total_issued THEN
        UPDATE inventory_loans SET status = 'Partially Returned' WHERE loan_id = p_loan_id;
    ELSEIF v_total_returned >= v_total_issued THEN
        UPDATE inventory_loans SET status = 'Returned', actual_return_date = CURRENT_TIMESTAMP WHERE loan_id = p_loan_id;
    END IF;
END //
DELIMITER ;

-- Get loan details by ID including items
DELIMITER //
CREATE PROCEDURE sp_GetInventoryLoanDetails(
    IN p_loan_id INT
)
BEGIN
    -- Get loan details
    SELECT 
        l.*,
        p.name AS project_name,
        t.name AS team_name,
        CONCAT(req.first_name, ' ', req.last_name) AS requester_name,
        CONCAT(app.first_name, ' ', app.last_name) AS approver_name,
        CONCAT(iss.first_name, ' ', iss.last_name) AS issuer_name
    FROM inventory_loans l
    INNER JOIN projects p ON l.project_id = p.project_id
    INNER JOIN teams t ON l.responsible_team_id = t.team_id
    INNER JOIN users req_u ON l.requested_by_user_id = req_u.user_id
    LEFT JOIN employees req ON req_u.employee_id = req.employee_id
    LEFT JOIN users app_u ON l.approved_by_user_id = app_u.user_id
    LEFT JOIN employees app ON app_u.employee_id = app.employee_id
    LEFT JOIN users iss_u ON l.issued_by_user_id = iss_u.user_id
    LEFT JOIN employees iss ON iss_u.employee_id = iss.employee_id
    WHERE l.loan_id = p_loan_id;
    
    -- Get loan items
    SELECT * FROM inventory_loan_items 
    WHERE loan_id = p_loan_id;
END //
DELIMITER ;


-- Get loans by project ID
DELIMITER //
CREATE PROCEDURE sp_GetInventoryLoansByProject(
    IN p_project_id INT
)
BEGIN
    SELECT 
        l.*,
        p.name AS project_name,
        t.name AS team_name,
        CONCAT(req.first_name, ' ', req.last_name) AS requester_name
    FROM inventory_loans l
    INNER JOIN projects p ON l.project_id = p.project_id
    INNER JOIN teams t ON l.responsible_team_id = t.team_id
    INNER JOIN users req_u ON l.requested_by_user_id = req_u.user_id
    LEFT JOIN employees req ON req_u.employee_id = req.employee_id
    WHERE l.project_id = p_project_id
    ORDER BY l.request_date DESC;
END //
DELIMITER ;

-- 6. Get Loans by Project/User/Team (example for user)
DELIMITER //
CREATE PROCEDURE sp_GetInventoryLoansByUser(
    IN p_user_id INT
)
BEGIN
    SELECT 
        l.*,
        p.name AS project_name,
        t.name AS team_name,
        CONCAT(req.first_name, ' ', req.last_name) AS requester_name
    FROM inventory_loans l
    INNER JOIN projects p ON l.project_id = p.project_id
    INNER JOIN teams t ON l.responsible_team_id = t.team_id
    INNER JOIN users req_u ON l.requested_by_user_id = req_u.user_id
    LEFT JOIN employees req ON req_u.employee_id = req.employee_id
    WHERE l.requested_by_user_id = p_user_id
    ORDER BY l.request_date DESC;
END //
DELIMITER ;

-- Get pending approvals for team leads
DELIMITER //
CREATE PROCEDURE sp_GetInventoryLoansPendingApproval(
    IN p_team_id INT
)
BEGIN
    SELECT 
        l.*,
        p.name AS project_name,
        t.name AS team_name,
        CONCAT(req.first_name, ' ', req.last_name) AS requester_name
    FROM inventory_loans l
    INNER JOIN projects p ON l.project_id = p.project_id
    INNER JOIN teams t ON l.responsible_team_id = t.team_id
    INNER JOIN users req_u ON l.requested_by_user_id = req_u.user_id
    LEFT JOIN employees req ON req_u.employee_id = req.employee_id
    WHERE l.responsible_team_id = p_team_id 
    AND l.status = 'Pending Approval'
    ORDER BY l.request_date DESC;
END //
DELIMITER ;

-- Get all loans for a team (for team members)
DELIMITER //
CREATE PROCEDURE sp_GetInventoryLoansByTeam(
    IN p_team_id INT
)
BEGIN
    SELECT 
        l.*,
        p.name AS project_name,
        t.name AS team_name,
        CONCAT(req.first_name, ' ', req.last_name) AS requester_name,
        CONCAT(app.first_name, ' ', app.last_name) AS approver_name,
        CONCAT(iss.first_name, ' ', iss.last_name) AS issuer_name
    FROM inventory_loans l
    INNER JOIN projects p ON l.project_id = p.project_id
    INNER JOIN teams t ON l.responsible_team_id = t.team_id
    INNER JOIN users req_u ON l.requested_by_user_id = req_u.user_id
    LEFT JOIN employees req ON req_u.employee_id = req.employee_id
    LEFT JOIN users app_u ON l.approved_by_user_id = app_u.user_id
    LEFT JOIN employees app ON app_u.employee_id = app.employee_id
    LEFT JOIN users iss_u ON l.issued_by_user_id = iss_u.user_id
    LEFT JOIN employees iss ON iss_u.employee_id = iss.employee_id
    WHERE l.responsible_team_id = p_team_id
    ORDER BY l.request_date DESC;
END //
DELIMITER ;
