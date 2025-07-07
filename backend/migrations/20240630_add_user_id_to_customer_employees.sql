-- Add user_id column to customer_employees table
ALTER TABLE customer_employees
ADD COLUMN user_id INT NULL,
ADD CONSTRAINT fk_customer_employee_user
  FOREIGN KEY (user_id)
  REFERENCES users(user_id)
  ON DELETE SET NULL;

-- Update the stored procedure to use the new column
DELIMITER //
CREATE OR REPLACE PROCEDURE sp_GetCustomerEmployeesWithUserStatus(
    IN p_customer_company_id INT
)
BEGIN
    SELECT 
        ce.customer_employee_id,
        ce.first_name,
        ce.last_name,
        ce.email,
        ce.phone,
        ce.position,
        ce.is_head,
        ce.created_at,
        ce.updated_at,
        u.user_id,
        u.username,
        u.role,
        u.last_login,
        CASE 
            WHEN u.user_id IS NOT NULL THEN 1
            ELSE 0
        END AS has_user_account
    FROM customer_employees ce
    LEFT JOIN users u ON ce.user_id = u.user_id
    WHERE ce.customer_company_id = p_customer_company_id
    ORDER BY ce.is_head DESC, ce.first_name, ce.last_name;
END //

DELIMITER ;
