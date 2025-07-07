-- ============================
-- CUSTOMER COMPANIES
-- ============================

-- Get all customer companies
CREATE PROCEDURE sp_GetAllCustomerCompanies()
BEGIN
    SELECT * FROM customer_companies ORDER BY created_at DESC;
END;

-- Get customer company by ID
CREATE PROCEDURE sp_GetCustomerCompanyById(IN p_customer_company_id INT)
BEGIN
    SELECT * FROM customer_companies WHERE customer_company_id = p_customer_company_id;
END;

-- Create new customer company
CREATE PROCEDURE sp_CreateCustomerCompany(
    IN p_name VARCHAR(255),
    IN p_industry VARCHAR(255),
    IN p_address TEXT,
    IN p_contact_email VARCHAR(255),
    IN p_contact_phone VARCHAR(20)
)
BEGIN
    INSERT INTO customer_companies (name, industry, address, contact_email, contact_phone)
    VALUES (p_name, p_industry, p_address, p_contact_email, p_contact_phone);

    SELECT LAST_INSERT_ID() AS customer_company_id;
END;

-- Update customer company
CREATE PROCEDURE sp_UpdateCustomerCompany(
    IN p_customer_company_id INT,
    IN p_name VARCHAR(255),
    IN p_industry VARCHAR(255),
    IN p_address TEXT,
    IN p_contact_email VARCHAR(255),
    IN p_contact_phone VARCHAR(20)
)
BEGIN
    UPDATE customer_companies
    SET name = p_name,
        industry = p_industry,
        address = p_address,
        contact_email = p_contact_email,
        contact_phone = p_contact_phone
    WHERE customer_company_id = p_customer_company_id;
END;

-- Delete customer company
CREATE PROCEDURE sp_DeleteCustomerCompany(IN p_customer_company_id INT)
BEGIN
    DELETE FROM customer_companies WHERE customer_company_id = p_customer_company_id;
    SELECT ROW_COUNT() AS deleted_rows;
END;

-- Check if customer company name exists
CREATE PROCEDURE sp_CheckCustomerCompanyNameExists(
    IN p_name VARCHAR(255),
    IN p_exclude_id INT
)
BEGIN
    IF p_exclude_id > 0 THEN
        SELECT COUNT(*) AS name_count FROM customer_companies
        WHERE name = p_name AND customer_company_id != p_exclude_id;
    ELSE
        SELECT COUNT(*) AS name_count FROM customer_companies
        WHERE name = p_name;
    END IF;
END;

-- Count customer company dependencies
CREATE PROCEDURE sp_CountCustomerCompanyDependencies(IN p_customer_company_id INT)
BEGIN
    SELECT COUNT(*) AS count FROM customer_details WHERE customer_company_id = p_customer_company_id;
END;

-- ============================
-- CUSTOMER DETAILS
-- ============================

-- Get all customer details
CREATE PROCEDURE sp_GetAllCustomerDetails()
BEGIN
    SELECT cd.*, cc.name AS company_name
    FROM customer_details cd
    LEFT JOIN customer_companies cc ON cd.customer_company_id = cc.customer_company_id
    ORDER BY cd.created_at DESC;
END;

-- Get customer details by ID
CREATE PROCEDURE sp_GetCustomerDetailsById(IN p_customer_id INT)
BEGIN
    SELECT cd.*, cc.name AS company_name
    FROM customer_details cd
    LEFT JOIN customer_companies cc ON cd.customer_company_id = cc.customer_company_id
    WHERE cd.customer_id = p_customer_id;
END;

-- Create new customer details
CREATE PROCEDURE sp_CreateCustomerDetails(
    IN p_customer_company_id INT,
    IN p_first_name VARCHAR(255),
    IN p_last_name VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_phone VARCHAR(20),
    IN p_position VARCHAR(255)
)
BEGIN
    INSERT INTO customer_details (customer_company_id, first_name, last_name, email, phone, position)
    VALUES (p_customer_company_id, p_first_name, p_last_name, p_email, p_phone, p_position);

    SELECT LAST_INSERT_ID() AS customer_id;
END;

-- Update customer details
CREATE PROCEDURE sp_UpdateCustomerDetails(
    IN p_customer_id INT,
    IN p_customer_company_id INT,
    IN p_first_name VARCHAR(255),
    IN p_last_name VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_phone VARCHAR(20),
    IN p_position VARCHAR(255)
)
BEGIN
    UPDATE customer_details
    SET customer_company_id = p_customer_company_id,
        first_name = p_first_name,
        last_name = p_last_name,
        email = p_email,
        phone = p_phone,
        position = p_position
    WHERE customer_id = p_customer_id;
END;

-- Delete customer details
CREATE PROCEDURE sp_DeleteCustomerDetails(IN p_customer_id INT)
BEGIN
    DELETE FROM customer_details WHERE customer_id = p_customer_id;
    SELECT ROW_COUNT() AS deleted_rows;
END;

-- Check if customer email exists
CREATE PROCEDURE sp_CheckCustomerEmailExists(
    IN p_email VARCHAR(255),
    IN p_exclude_id INT
)
BEGIN
    IF p_exclude_id > 0 THEN
        SELECT COUNT(*) AS email_count FROM customer_details
        WHERE email = p_email AND customer_id != p_exclude_id;
    ELSE
        SELECT COUNT(*) AS email_count FROM customer_details
        WHERE email = p_email;
    END IF;
END;

-- Get customer by ID
CREATE PROCEDURE sp_GetCustomerById(IN p_customer_id INT)
BEGIN
    SELECT * FROM customer_details WHERE customer_id = p_customer_id;
END;