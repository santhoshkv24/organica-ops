DELIMITER //

-- Get customer team head by project ID
CREATE PROCEDURE sp_GetCustomerTeamHeadByProjectId(IN p_project_id INT)
BEGIN
    SELECT
        ce.customer_employee_id,
        ce.customer_company_id,
        ce.first_name,
        ce.last_name,
        ce.email,
        ce.phone,
        ce.position,
        ce.is_head,
        cc.name AS customer_company_name,
        u.user_id,
        u.username,
        u.role
    FROM customer_employees ce
    JOIN customer_companies cc ON ce.customer_company_id = cc.customer_company_id
    JOIN users u ON ce.customer_employee_id = u.customer_id
    JOIN projects p ON cc.customer_company_id = p.customer_company_id
    WHERE p.project_id = p_project_id AND ce.is_head = TRUE AND u.role = 'customer_head';
END //

-- Get customer team head by user ID
CREATE PROCEDURE sp_GetCustomerTeamHeadByUserId(IN p_user_id INT)
BEGIN
    SELECT
        ce.customer_employee_id,
        ce.customer_company_id,
        ce.first_name,
        ce.last_name,
        ce.email,
        ce.phone,
        ce.position,
        ce.is_head,
        cc.name AS customer_company_name,
        u.user_id,
        u.username,
        u.role
    FROM customer_employees ce
    JOIN customer_companies cc ON ce.customer_company_id = cc.customer_company_id
    JOIN users u ON ce.customer_employee_id = u.customer_id
    WHERE u.user_id = p_user_id AND ce.is_head = TRUE AND u.role = 'customer_head';
END //

DELIMITER ;