-- ============================
-- CUSTOMER TRACK ENTRIES
-- ============================

-- Create a customer track entry
DELIMITER //

CREATE PROCEDURE sp_CreateCustomerTrackEntry(
    IN p_project_id INT,
    IN p_assigned_to INT,
    IN p_assigned_by INT,
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_task_type ENUM('Bug','Feature','Task','Documentation','Other'),
    IN p_priority ENUM('Low','Medium','High','Critical'),
    IN p_status ENUM('To Do','In Progress','Blocked','Done'),
    IN p_due_date DATE
)
BEGIN
    DECLARE v_assigned_by_role VARCHAR(20);
    DECLARE v_is_valid_assignment BOOLEAN DEFAULT FALSE;
    DECLARE v_is_project_manager BOOLEAN DEFAULT FALSE;
    DECLARE v_is_customer_head BOOLEAN DEFAULT FALSE;
    DECLARE v_assigned_to_company_id INT;
    DECLARE v_assigner_company_id INT;

    -- Get the role of the person assigning the task
    SELECT role INTO v_assigned_by_role 
    FROM users 
    WHERE user_id = p_assigned_by 
    LIMIT 1;

    -- Check if the assigner is the project manager for this project
    IF v_assigned_by_role = 'manager' THEN
        SELECT EXISTS (
            SELECT 1 FROM projects p
            WHERE p.project_id = p_project_id 
              AND p.project_manager_id = (SELECT employee_id FROM users WHERE user_id = p_assigned_by)
        ) INTO v_is_project_manager;
    END IF;

    -- Check if the assignee is a customer head
    SELECT is_head, customer_company_id INTO v_is_customer_head, v_assigned_to_company_id
    FROM customer_employees
    WHERE customer_employee_id = p_assigned_to
    LIMIT 1;

    -- If assigner is customer_head, get their company ID
    IF v_assigned_by_role = 'customer_head' THEN
        SELECT ce.customer_company_id INTO v_assigner_company_id
        FROM customer_employees ce
        JOIN users u ON ce.customer_employee_id = u.customer_id
        WHERE u.user_id = p_assigned_by
        LIMIT 1;
    END IF;

    -- Check if assignment is valid
    IF v_assigned_by_role = 'admin' THEN
        SET v_is_valid_assignment = TRUE;
    ELSEIF v_assigned_by_role = 'manager' AND v_is_project_manager THEN
        -- Project manager can only assign to customer heads
        IF v_is_customer_head THEN
            SET v_is_valid_assignment = TRUE;
        END IF;
    ELSEIF v_assigned_by_role = 'customer_head' THEN
        -- Customer head can only assign to their company's employees who are not heads
        IF v_assigned_to_company_id = v_assigner_company_id AND NOT v_is_customer_head THEN
            SET v_is_valid_assignment = TRUE;
        END IF;
    END IF;

    IF NOT v_is_valid_assignment THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'You do not have permission to assign tasks to this customer employee';
    END IF;

    -- Proceed with task creation
    INSERT INTO customer_track_entries (
        project_id, assigned_to, assigned_by, title, 
        description, task_type, priority, status, due_date, 
        status_updated_at
    ) VALUES (
        p_project_id, p_assigned_to, p_assigned_by, p_title,
        p_description, p_task_type, p_priority, p_status, p_due_date,
        CURRENT_TIMESTAMP
    );

    -- Log the assignment
    INSERT INTO customer_track_entry_history (
        customer_track_entry_id, field_changed, old_value, new_value, changed_by, is_customer, changed_at
    ) VALUES (
        LAST_INSERT_ID(), 'status', 'New', p_status, p_assigned_by, FALSE, CURRENT_TIMESTAMP
    );

    SELECT LAST_INSERT_ID() AS customer_track_entry_id;
END//

DELIMITER ;

-- Update a customer track entry
DELIMITER //
CREATE PROCEDURE sp_UpdateCustomerTrackEntry(
    IN p_customer_track_entry_id INT,
    IN p_user_id INT,
    IN p_is_customer BOOLEAN,
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_task_type ENUM('Bug','Feature','Task','Documentation','Other'),
    IN p_priority ENUM('Low','Medium','High','Critical'),
    IN p_status ENUM('To Do','In Progress','Blocked','Done'),
    IN p_due_date DATE
)
BEGIN
    DECLARE v_old_status VARCHAR(20);
    DECLARE v_assigned_to INT;
    DECLARE v_assigned_by INT;
    DECLARE v_is_valid_update BOOLEAN DEFAULT FALSE;
    DECLARE v_user_role VARCHAR(20);
    
    -- Get current status and assignment
    SELECT status, assigned_to, assigned_by INTO v_old_status, v_assigned_to, v_assigned_by
    FROM customer_track_entries 
    WHERE customer_track_entry_id = p_customer_track_entry_id
    FOR UPDATE;
    
    -- Get the role of the person updating the task
    IF NOT p_is_customer THEN
        SELECT role INTO v_user_role 
        FROM users 
        WHERE user_id = p_user_id 
        LIMIT 1;
    ELSE
        -- For customers, set a placeholder role
        SET v_user_role = 'customer';
    END IF;
    
    -- Check if update is valid
    IF p_is_customer THEN
        -- Customer can only update status if they are assigned to the task
        IF p_user_id = v_assigned_to THEN
            -- Only update status
            UPDATE customer_track_entries
            SET 
                status = COALESCE(p_status, status),
                updated_at = CURRENT_TIMESTAMP,
                status_updated_at = CASE 
                    WHEN p_status IS NOT NULL AND p_status != v_old_status 
                    THEN CURRENT_TIMESTAMP 
                    ELSE status_updated_at 
                END
            WHERE customer_track_entry_id = p_customer_track_entry_id;
            
            SET v_is_valid_update = TRUE;
        END IF;
    ELSE
        -- Employee update permissions
        IF v_user_role = 'admin' OR 
           (v_user_role = 'manager' AND EXISTS (
               SELECT 1 FROM projects p 
               JOIN customer_track_entries cte ON p.project_id = cte.project_id
               WHERE cte.customer_track_entry_id = p_customer_track_entry_id
               AND p.project_manager_id = p_user_id
           )) OR
           p_user_id = v_assigned_by THEN
            -- Full update permissions
            UPDATE customer_track_entries
            SET 
                title = COALESCE(p_title, title),
                description = COALESCE(p_description, description),
                task_type = COALESCE(p_task_type, task_type),
                priority = COALESCE(p_priority, priority),
                status = COALESCE(p_status, status),
                due_date = COALESCE(p_due_date, due_date),
                updated_at = CURRENT_TIMESTAMP,
                status_updated_at = CASE 
                    WHEN p_status IS NOT NULL AND p_status != v_old_status 
                    THEN CURRENT_TIMESTAMP 
                    ELSE status_updated_at 
                END
            WHERE customer_track_entry_id = p_customer_track_entry_id;
            
            SET v_is_valid_update = TRUE;
        END IF;
    END IF;
    
    IF NOT v_is_valid_update THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'You do not have permission to update this task';
    END IF;
    
    -- Log status changes
    IF p_status IS NOT NULL AND p_status != v_old_status THEN
        INSERT INTO customer_track_entry_history (
            customer_track_entry_id, field_changed, old_value, new_value, changed_by, is_customer, changed_at
        ) VALUES (
            p_customer_track_entry_id, 'status', v_old_status, p_status, p_user_id, p_is_customer, CURRENT_TIMESTAMP
        );
    END IF;
END //
DELIMITER ;

-- Get customer track entry by ID
DELIMITER //
CREATE PROCEDURE sp_GetCustomerTrackEntryById(
    IN p_customer_track_entry_id INT,
    IN p_user_id INT,
    IN p_is_customer BOOLEAN
)
BEGIN
    DECLARE v_user_role VARCHAR(20);
    DECLARE v_has_access BOOLEAN DEFAULT FALSE;
    DECLARE v_customer_company_id INT;
    DECLARE v_is_customer_head BOOLEAN DEFAULT FALSE;
    DECLARE v_entry_company_id INT;
    DECLARE v_employee_id INT;
    
    -- For employees, get their role
    IF NOT p_is_customer THEN
        SELECT role, employee_id INTO v_user_role, v_employee_id
        FROM users 
        WHERE user_id = p_user_id 
        LIMIT 1;
    ELSE
        -- For customers, get their role and company ID
        SELECT u.role, ce.customer_company_id, ce.is_head 
        INTO v_user_role, v_customer_company_id, v_is_customer_head
        FROM users u
        JOIN customer_employees ce ON u.customer_id = ce.customer_employee_id
        WHERE u.user_id = p_user_id 
        LIMIT 1;
        
        -- Get the company ID of the entry's assignee
        SELECT ce.customer_company_id INTO v_entry_company_id
        FROM customer_track_entries cte
        JOIN customer_employees ce ON cte.assigned_to = ce.customer_employee_id
        WHERE cte.customer_track_entry_id = p_customer_track_entry_id;
    END IF;
    
    -- Check access
    IF NOT p_is_customer THEN
        -- Employee access check
        IF v_user_role = 'admin' THEN
            SET v_has_access = TRUE;
        ELSEIF v_user_role = 'manager' THEN
            -- Check if employee is the project manager for this task's project
            SELECT EXISTS (
                SELECT 1 FROM customer_track_entries cte
                JOIN projects p ON cte.project_id = p.project_id
                WHERE cte.customer_track_entry_id = p_customer_track_entry_id
                AND p.project_manager_id = v_employee_id
            ) INTO v_has_access;
        ELSE
            -- Check if employee created the task
            SELECT EXISTS (
                SELECT 1 FROM customer_track_entries 
                WHERE customer_track_entry_id = p_customer_track_entry_id
                AND assigned_by = p_user_id
            ) INTO v_has_access;
        END IF;
    ELSE
        -- Customer access check
        IF v_user_role = 'customer_head' AND v_is_customer_head THEN
            -- Customer heads can see tasks for their company's employees
            IF v_entry_company_id = v_customer_company_id THEN
                SET v_has_access = TRUE;
            END IF;
        ELSE
            -- Regular customer employees can only see tasks assigned to them
            SELECT EXISTS (
                SELECT 1 FROM customer_track_entries cte
                JOIN customer_employees ce ON cte.assigned_to = ce.customer_employee_id
                JOIN users u ON ce.customer_employee_id = u.customer_id
                WHERE cte.customer_track_entry_id = p_customer_track_entry_id
                AND u.user_id = p_user_id
            ) INTO v_has_access;
        END IF;
    END IF;
    
    IF NOT v_has_access THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'You do not have permission to view this task';
    END IF;
    
    -- Return task details
    SELECT 
        cte.customer_track_entry_id,
        cte.project_id,
        p.name AS project_name,
        cte.assigned_to,
        CONCAT(ce.first_name, ' ', ce.last_name) AS assigned_to_name,
        ce.email AS assigned_to_email,
        ce.customer_company_id,
        cc.name AS customer_company_name,
        cte.assigned_by,
        COALESCE(
            CONCAT(emp.first_name, ' ', emp.last_name),
            cust_assigner.first_name,
            u.username
        ) AS assigned_by_name,
        COALESCE(
            emp.email,
            cust_assigner.email,
            u.email
        ) AS assigned_by_email,
        cte.title,
        cte.description,
        cte.task_type,
        cte.priority,
        cte.status,
        cte.due_date,
        cte.status_updated_at,
        cte.created_at,
        cte.updated_at,
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'field_changed', h.field_changed,
                    'old_value', h.old_value,
                    'new_value', h.new_value,
                    'changed_at', h.changed_at,
                    'changed_by', IF(h.is_customer, 
                        CONCAT(ce2.first_name, ' ', ce2.last_name),
                        u2.username
                    ),
                    'is_customer', h.is_customer
                )
            )
            FROM customer_track_entry_history h
            LEFT JOIN users u2 ON h.changed_by = u2.user_id AND h.is_customer = FALSE
            LEFT JOIN customer_employees ce2 ON h.changed_by = ce2.customer_employee_id AND h.is_customer = TRUE
            WHERE h.customer_track_entry_id = cte.customer_track_entry_id
            ORDER BY h.changed_at DESC
        ) as change_history
    FROM customer_track_entries cte
    JOIN projects p ON cte.project_id = p.project_id
    JOIN customer_employees ce ON cte.assigned_to = ce.customer_employee_id
    JOIN customer_companies cc ON ce.customer_company_id = cc.customer_company_id
    LEFT JOIN users u ON cte.assigned_by = u.user_id
    LEFT JOIN employees emp ON u.employee_id = emp.employee_id
    LEFT JOIN customer_employees cust_assigner ON u.customer_id = cust_assigner.customer_employee_id
    WHERE cte.customer_track_entry_id = p_customer_track_entry_id;
END //
DELIMITER ;

-- Get customer track entries with filters
DELIMITER //
CREATE PROCEDURE sp_GetCustomerTrackEntries(
    IN p_project_id INT,
    IN p_customer_company_id INT,
    IN p_assigned_to INT,
    IN p_assigned_by INT,
    IN p_status VARCHAR(20),
    IN p_priority VARCHAR(20),
    IN p_task_type VARCHAR(50),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_limit INT,
    IN p_offset INT,
    IN p_user_id INT,
    IN p_is_customer BOOLEAN
)
BEGIN
    DECLARE v_user_role VARCHAR(20);
    DECLARE v_customer_company_id INT;
    DECLARE v_is_customer_head BOOLEAN DEFAULT FALSE;
    DECLARE v_employee_id INT;
    
    -- For employees, get their role
    IF NOT p_is_customer THEN
        SELECT role, employee_id INTO v_user_role, v_employee_id
        FROM users 
        WHERE user_id = p_user_id 
        LIMIT 1;
    ELSE
        -- For customers, get their role and company ID
        SELECT u.role, ce.customer_company_id, ce.is_head 
        INTO v_user_role, v_customer_company_id, v_is_customer_head
        FROM users u
        JOIN customer_employees ce ON u.customer_id = ce.customer_employee_id
        WHERE u.user_id = p_user_id 
        LIMIT 1;
    END IF;
    
    -- Get total count for pagination
    SET @count_sql = CONCAT('
        SELECT COUNT(*) as total_count
        FROM customer_track_entries cte
        JOIN projects p ON cte.project_id = p.project_id
        JOIN customer_employees ce ON cte.assigned_to = ce.customer_employee_id
        JOIN customer_companies cc ON ce.customer_company_id = cc.customer_company_id
        JOIN users u ON cte.assigned_by = u.user_id
        WHERE 1=1 '
    );
    
    -- Add access filters
    IF p_is_customer THEN
        IF v_user_role = 'customer_head' AND v_is_customer_head THEN
            -- Customer heads can see tasks for their company's employees
            SET @count_sql = CONCAT(@count_sql, ' AND ce.customer_company_id = ', v_customer_company_id);
        ELSE
            -- Regular customer employees can only see tasks assigned to them
            SET @count_sql = CONCAT(@count_sql, ' AND cte.assigned_to = ', p_user_id);
        END IF;
    ELSE
        -- Employee access based on role
        IF v_user_role = 'admin' THEN
            -- Admin can see all (no additional filter needed)
            SET @count_sql = CONCAT(@count_sql, '');
        ELSEIF v_user_role = 'manager' THEN
            -- Managers can see tasks for projects they manage
            SET @count_sql = CONCAT(@count_sql, ' AND EXISTS (SELECT 1 FROM projects p2 WHERE p2.project_id = cte.project_id AND p2.project_manager_id = ', v_employee_id, ')');
        ELSE
            -- Other employees can only see tasks they assigned
            SET @count_sql = CONCAT(@count_sql, ' AND cte.assigned_by = ', p_user_id);
        END IF;
    END IF;
    
    -- Add other filters
    IF p_project_id IS NOT NULL THEN
        SET @count_sql = CONCAT(@count_sql, ' AND cte.project_id = ', p_project_id);
    END IF;
    
    IF p_customer_company_id IS NOT NULL THEN
        SET @count_sql = CONCAT(@count_sql, ' AND ce.customer_company_id = ', p_customer_company_id);
    END IF;
    
    IF p_assigned_to IS NOT NULL THEN
        SET @count_sql = CONCAT(@count_sql, ' AND cte.assigned_to = ', p_assigned_to);
    END IF;
    
    IF p_assigned_by IS NOT NULL THEN
        SET @count_sql = CONCAT(@count_sql, ' AND cte.assigned_by = ', p_assigned_by);
    END IF;
    
    IF p_status IS NOT NULL THEN
        SET @count_sql = CONCAT(@count_sql, ' AND cte.status = "', p_status, '"');
    END IF;
    
    IF p_priority IS NOT NULL THEN
        SET @count_sql = CONCAT(@count_sql, ' AND cte.priority = "', p_priority, '"');
    END IF;
    
    IF p_task_type IS NOT NULL THEN
        SET @count_sql = CONCAT(@count_sql, ' AND cte.task_type = "', p_task_type, '"');
    END IF;
    
    IF p_start_date IS NOT NULL THEN
        SET @count_sql = CONCAT(@count_sql, ' AND cte.due_date >= "', p_start_date, '"');
    END IF;
    
    IF p_end_date IS NOT NULL THEN
        SET @count_sql = CONCAT(@count_sql, ' AND cte.due_date <= "', p_end_date, '"');
    END IF;
    
    PREPARE stmt FROM @count_sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Get paginated results
    SET @data_sql = CONCAT('
        SELECT 
            cte.customer_track_entry_id,
            cte.project_id,
            p.name AS project_name,
            cte.assigned_to,
            CONCAT(ce.first_name, " ", ce.last_name) AS assigned_to_name,
            ce.email AS assigned_to_email,
            ce.customer_company_id,
            cc.name AS customer_company_name,
            cte.assigned_by,
            u.username AS assigned_by_name,
            u.email AS assigned_by_email,
            cte.title,
            cte.description,
            cte.task_type,
            cte.priority,
            cte.status,
            cte.due_date,
            cte.status_updated_at,
            cte.created_at,
            cte.updated_at
        FROM customer_track_entries cte
        JOIN projects p ON cte.project_id = p.project_id
        JOIN customer_employees ce ON cte.assigned_to = ce.customer_employee_id
        JOIN customer_companies cc ON ce.customer_company_id = cc.customer_company_id
        JOIN users u ON cte.assigned_by = u.user_id
        WHERE 1=1 '
    );
    
    -- Add access filters (same as count query)
    IF p_is_customer THEN
        IF v_user_role = 'customer_head' AND v_is_customer_head THEN
            -- Customer heads can see tasks for their company's employees
            SET @data_sql = CONCAT(@data_sql, ' AND ce.customer_company_id = ', v_customer_company_id);
        ELSE
            -- Regular customer employees can only see tasks assigned to them
            SET @data_sql = CONCAT(@data_sql, ' AND cte.assigned_to = ', p_user_id);
        END IF;
    ELSE
        -- Employee access based on role
        IF v_user_role = 'admin' THEN
            -- Admin can see all
            SET @data_sql = CONCAT(@data_sql, '');
        ELSEIF v_user_role = 'manager' THEN
            -- Managers can see tasks for projects they manage
            SET @data_sql = CONCAT(@data_sql, ' AND EXISTS (SELECT 1 FROM projects p2 WHERE p2.project_id = cte.project_id AND p2.project_manager_id = ', v_employee_id, ')');
        ELSE
            -- Other employees can only see tasks they assigned
            SET @data_sql = CONCAT(@data_sql, ' AND cte.assigned_by = ', p_user_id);
        END IF;
    END IF;
    
    -- Add other filters (same as count query)
    IF p_project_id IS NOT NULL THEN
        SET @data_sql = CONCAT(@data_sql, ' AND cte.project_id = ', p_project_id);
    END IF;
    
    IF p_customer_company_id IS NOT NULL THEN
        SET @data_sql = CONCAT(@data_sql, ' AND ce.customer_company_id = ', p_customer_company_id);
    END IF;
    
    IF p_assigned_to IS NOT NULL THEN
        SET @data_sql = CONCAT(@data_sql, ' AND cte.assigned_to = ', p_assigned_to);
    END IF;
    
    IF p_assigned_by IS NOT NULL THEN
        SET @data_sql = CONCAT(@data_sql, ' AND cte.assigned_by = ', p_assigned_by);
    END IF;
    
    IF p_status IS NOT NULL THEN
        SET @data_sql = CONCAT(@data_sql, ' AND cte.status = "', p_status, '"');
    END IF;
    
    IF p_priority IS NOT NULL THEN
        SET @data_sql = CONCAT(@data_sql, ' AND cte.priority = "', p_priority, '"');
    END IF;
    
    IF p_task_type IS NOT NULL THEN
        SET @data_sql = CONCAT(@data_sql, ' AND cte.task_type = "', p_task_type, '"');
    END IF;
    
    IF p_start_date IS NOT NULL THEN
        SET @data_sql = CONCAT(@data_sql, ' AND cte.due_date >= "', p_start_date, '"');
    END IF;
    
    IF p_end_date IS NOT NULL THEN
        SET @data_sql = CONCAT(@data_sql, ' AND cte.due_date <= "', p_end_date, '"');
    END IF;
    
    -- Add ordering and pagination
    SET @data_sql = CONCAT(@data_sql, '
        ORDER BY cte.due_date DESC, cte.priority DESC
        LIMIT ', p_limit, ' OFFSET ', p_offset
    );
    
    PREPARE stmt FROM @data_sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END //
DELIMITER ;

-- Update customer track entry status only
DELIMITER //
CREATE PROCEDURE sp_UpdateCustomerTrackEntryStatus(
    IN p_customer_track_entry_id INT,
    IN p_status ENUM('To Do','In Progress','Blocked','Done'),
    IN p_user_id INT,
    IN p_is_customer BOOLEAN
)
BEGIN
    DECLARE v_old_status VARCHAR(20);
    DECLARE v_assigned_to INT;
    DECLARE v_assigned_by INT;
    DECLARE v_is_valid_update BOOLEAN DEFAULT FALSE;
    DECLARE v_user_role VARCHAR(20);
    DECLARE v_customer_company_id INT;
    DECLARE v_entry_company_id INT;
    DECLARE v_is_customer_head BOOLEAN DEFAULT FALSE;
    DECLARE v_employee_id INT;
    
    -- Get current status and assignment
    SELECT status, assigned_to, assigned_by INTO v_old_status, v_assigned_to, v_assigned_by
    FROM customer_track_entries 
    WHERE customer_track_entry_id = p_customer_track_entry_id
    FOR UPDATE;
    
    -- For employees, get their role
    IF NOT p_is_customer THEN
        SELECT role, employee_id INTO v_user_role, v_employee_id
        FROM users 
        WHERE user_id = p_user_id 
        LIMIT 1;
    ELSE
        -- For customers, get their role and company ID
        SELECT u.role, ce.customer_company_id, ce.is_head 
        INTO v_user_role, v_customer_company_id, v_is_customer_head
        FROM users u
        JOIN customer_employees ce ON u.customer_id = ce.customer_employee_id
        WHERE u.user_id = p_user_id 
        LIMIT 1;
        
        -- Get the company ID of the entry's assignee
        SELECT ce.customer_company_id INTO v_entry_company_id
        FROM customer_track_entries cte
        JOIN customer_employees ce ON cte.assigned_to = ce.customer_employee_id
        WHERE cte.customer_track_entry_id = p_customer_track_entry_id;
    END IF;
    
    -- Check if update is valid
    IF NOT p_is_customer THEN
        -- Employee update permissions
        IF v_user_role = 'admin' THEN
            SET v_is_valid_update = TRUE;
        ELSEIF v_user_role = 'manager' THEN
            -- Check if employee is the project manager for this task's project
            SELECT EXISTS (
                SELECT 1 FROM customer_track_entries cte
                JOIN projects p ON cte.project_id = p.project_id
                WHERE cte.customer_track_entry_id = p_customer_track_entry_id
                AND p.project_manager_id = v_employee_id
            ) INTO v_is_valid_update;
        ELSE
            -- Check if employee created the task
            IF p_user_id = v_assigned_by THEN
                SET v_is_valid_update = TRUE;
            END IF;
        END IF;
    ELSE
        -- Customer update permissions
        IF v_user_role = 'customer_head' AND v_is_customer_head THEN
            -- Customer heads can update status for their company's employees
            IF v_entry_company_id = v_customer_company_id THEN
                SET v_is_valid_update = TRUE;
            END IF;
        ELSE
            -- Regular customer employees can only update their own tasks
            SELECT EXISTS (
                SELECT 1 FROM customer_track_entries cte
                JOIN customer_employees ce ON cte.assigned_to = ce.customer_employee_id
                JOIN users u ON ce.customer_employee_id = u.customer_id
                WHERE cte.customer_track_entry_id = p_customer_track_entry_id
                AND u.user_id = p_user_id
            ) INTO v_is_valid_update;
        END IF;
    END IF;
    
    IF NOT v_is_valid_update THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'You do not have permission to update this task status';
    END IF;
    
    -- Update status
    UPDATE customer_track_entries
    SET 
        status = p_status,
        status_updated_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE customer_track_entry_id = p_customer_track_entry_id;
    
    -- Log status change
    INSERT INTO customer_track_entry_history (
        customer_track_entry_id, field_changed, old_value, new_value, changed_by, is_customer, changed_at
    ) VALUES (
        p_customer_track_entry_id, 'status', v_old_status, p_status, p_user_id, p_is_customer, CURRENT_TIMESTAMP
    );
END //
DELIMITER ;

-- Delete a customer track entry
DELIMITER //
CREATE PROCEDURE sp_DeleteCustomerTrackEntry(
    IN p_customer_track_entry_id INT,
    IN p_user_id INT
)
BEGIN
    DECLARE v_user_role VARCHAR(20);
    DECLARE v_employee_id INT;
    DECLARE v_is_valid_delete BOOLEAN DEFAULT FALSE;
    DECLARE v_deleted_rows INT DEFAULT 0;
    
    -- Get the user's role
    SELECT role, employee_id INTO v_user_role, v_employee_id
    FROM users 
    WHERE user_id = p_user_id 
    LIMIT 1;
    
    -- Only admin and managers can delete entries
    IF v_user_role = 'admin' THEN
        SET v_is_valid_delete = TRUE;
    ELSEIF v_user_role = 'manager' THEN
        -- Check if the user is the project manager for this entry's project
        SELECT EXISTS (
            SELECT 1 FROM customer_track_entries cte
            JOIN projects p ON cte.project_id = p.project_id
            WHERE cte.customer_track_entry_id = p_customer_track_entry_id
            AND p.project_manager_id = v_employee_id
        ) INTO v_is_valid_delete;
    END IF;
    
    IF NOT v_is_valid_delete THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'You do not have permission to delete this task';
    END IF;
    
    -- Delete the entry
    DELETE FROM customer_track_entries 
    WHERE customer_track_entry_id = p_customer_track_entry_id;
    
    -- Return the number of affected rows
    SELECT ROW_COUNT() INTO v_deleted_rows;
    
    -- Return the result
    SELECT v_deleted_rows AS deleted_rows;
END //
DELIMITER ;

-- Get customer employee dashboard data
DELIMITER //
CREATE PROCEDURE sp_GetCustomerEmployeeDashboard(
    IN p_user_id INT
)
BEGIN
    DECLARE v_customer_employee_id INT;
    DECLARE v_customer_company_id INT;
    DECLARE v_is_head BOOLEAN DEFAULT FALSE;
    DECLARE v_role VARCHAR(20);
    
    -- Get customer employee info
    SELECT 
        u.customer_id, 
        ce.customer_company_id, 
        ce.is_head,
        u.role
    INTO 
        v_customer_employee_id, 
        v_customer_company_id, 
        v_is_head,
        v_role
    FROM users u
    JOIN customer_employees ce ON u.customer_id = ce.customer_employee_id
    WHERE u.user_id = p_user_id;
    
    -- For both customer team heads and regular employees, show only their tasks in My Tasks section
    -- Removed the condition that was showing all company tasks for customer_head
    SELECT 
        cte.customer_track_entry_id,
        cte.project_id,
        p.name AS project_name,
        cte.assigned_to,
        CONCAT(ce.first_name, ' ', ce.last_name) AS assigned_to_name,
        ce.email AS assigned_to_email,
        ce.customer_company_id,
        cc.name AS customer_company_name,
        cte.assigned_by,
        u.username AS assigned_by_name,
        cte.title,
        cte.description,
        cte.task_type,
        cte.priority,
        cte.status,
        cte.due_date,
        cte.status_updated_at,
        cte.created_at,
        cte.updated_at
    FROM customer_track_entries cte
    JOIN projects p ON cte.project_id = p.project_id
    JOIN customer_employees ce ON cte.assigned_to = ce.customer_employee_id
    JOIN customer_companies cc ON ce.customer_company_id = cc.customer_company_id
    JOIN users u ON cte.assigned_by = u.user_id
    WHERE cte.assigned_to = v_customer_employee_id
    ORDER BY cte.due_date ASC, cte.priority DESC;
END //
DELIMITER ;

-- Create a new procedure for customer team heads to view all company tasks separately
DELIMITER //
CREATE PROCEDURE sp_GetCustomerCompanyTasks(
    IN p_user_id INT
)
BEGIN
    DECLARE v_customer_employee_id INT;
    DECLARE v_customer_company_id INT;
    DECLARE v_is_head BOOLEAN DEFAULT FALSE;
    DECLARE v_role VARCHAR(20);
    
    -- Get customer employee info
    SELECT 
        u.customer_id, 
        ce.customer_company_id, 
        ce.is_head,
        u.role
    INTO 
        v_customer_employee_id, 
        v_customer_company_id, 
        v_is_head,
        v_role
    FROM users u
    JOIN customer_employees ce ON u.customer_id = ce.customer_employee_id
    WHERE u.user_id = p_user_id;
    
    -- Only allow customer team heads to view company tasks
    IF v_role = 'customer_head' AND v_is_head THEN
        -- Get all tasks assigned to their company's employees
        SELECT 
            cte.customer_track_entry_id,
            cte.project_id,
            p.name AS project_name,
            cte.assigned_to,
            CONCAT(ce.first_name, ' ', ce.last_name) AS assigned_to_name,
            ce.email AS assigned_to_email,
            ce.customer_company_id,
            cc.name AS customer_company_name,
            cte.assigned_by,
            u.username AS assigned_by_name,
            cte.title,
            cte.description,
            cte.task_type,
            cte.priority,
            cte.status,
            cte.due_date,
            cte.status_updated_at,
            cte.created_at,
            cte.updated_at
        FROM customer_track_entries cte
        JOIN projects p ON cte.project_id = p.project_id
        JOIN customer_employees ce ON cte.assigned_to = ce.customer_employee_id
        JOIN customer_companies cc ON ce.customer_company_id = cc.customer_company_id
        JOIN users u ON cte.assigned_by = u.user_id
        WHERE ce.customer_company_id = v_customer_company_id
        ORDER BY cte.due_date ASC, cte.priority DESC;
    ELSE
        -- Return empty result for non-team heads
        SELECT 
            NULL AS customer_track_entry_id,
            NULL AS project_id,
            NULL AS project_name,
            NULL AS assigned_to,
            NULL AS assigned_to_name,
            NULL AS assigned_to_email,
            NULL AS customer_company_id,
            NULL AS customer_company_name,
            NULL AS assigned_by,
            NULL AS assigned_by_name,
            NULL AS title,
            NULL AS description,
            NULL AS task_type,
            NULL AS priority,
            NULL AS status,
            NULL AS due_date,
            NULL AS status_updated_at,
            NULL AS created_at,
            NULL AS updated_at
        WHERE FALSE;
    END IF;
END //
DELIMITER ;

-- Get customer track entries by assigned_by
DELIMITER //
CREATE PROCEDURE sp_GetCustomerTrackEntriesByAssignedBy(
    IN p_assigned_by INT,
    IN p_user_id INT,
    IN p_project_id INT,
    IN p_status VARCHAR(20),
    IN p_priority VARCHAR(20),
    IN p_task_type VARCHAR(50),
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    DECLARE v_requester_role VARCHAR(20);
    DECLARE v_customer_id INT;
    DECLARE v_customer_company_id INT;
    
    -- Get requester's role and customer_id
    SELECT role, customer_id INTO v_requester_role, v_customer_id
    FROM users 
    WHERE user_id = p_user_id 
    LIMIT 1;
    
    -- If user is a customer, get their company ID
    IF v_requester_role IN ('customer_head', 'customer_employee') THEN
        SELECT customer_company_id INTO v_customer_company_id
        FROM customer_employees
        WHERE customer_employee_id = v_customer_id
        LIMIT 1;
    END IF;
    
    -- Get results - simplified without pagination
    SELECT 
        cte.customer_track_entry_id,
        cte.project_id,
        p.name AS project_name,
        cte.assigned_to,
        CONCAT(ce.first_name, ' ', ce.last_name) AS assigned_to_name,
        ce.email AS assigned_to_email,
        ce.customer_company_id,
        cc.name AS customer_company_name,
        cte.assigned_by,
        u.username AS assigned_by_name,
        cte.title,
        cte.description,
        cte.task_type,
        cte.priority,
        cte.status,
        cte.due_date,
        cte.status_updated_at,
        cte.created_at,
        cte.updated_at
    FROM customer_track_entries cte
    JOIN projects p ON cte.project_id = p.project_id
    JOIN customer_employees ce ON cte.assigned_to = ce.customer_employee_id
    JOIN customer_companies cc ON ce.customer_company_id = cc.customer_company_id
    JOIN users u ON cte.assigned_by = u.user_id
    WHERE cte.assigned_by = p_assigned_by
      -- For customers, only show entries for their company
      AND (v_requester_role NOT IN ('customer_head', 'customer_employee') OR ce.customer_company_id = v_customer_company_id)
      AND (p_project_id IS NULL OR cte.project_id = p_project_id)
      AND (p_status IS NULL OR cte.status = p_status)
      AND (p_priority IS NULL OR cte.priority = p_priority)
      AND (p_task_type IS NULL OR cte.task_type = p_task_type)
      AND (p_start_date IS NULL OR cte.due_date >= p_start_date)
      AND (p_end_date IS NULL OR cte.due_date <= p_end_date)
    ORDER BY cte.due_date DESC, cte.priority DESC;
END //
DELIMITER ;

