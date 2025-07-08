-- 1. Create Track Entry with Assignment Validation
CREATE PROCEDURE sp_CreateTrackEntry(
    IN p_project_id INT,
    IN p_team_id INT,
    IN p_employee_id INT,
    IN p_assigned_by INT,
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_task_type ENUM('Bug','Feature','Task','Documentation','Other'),
    IN p_priority ENUM('Low','Medium','High','Critical'),
    IN p_status ENUM('To Do','In Progress','Blocked','Done'),
    IN p_due_date DATE,
    IN p_hours_spent DECIMAL(5,2)
)
BEGIN
    DECLARE v_assigned_by_role VARCHAR(20);
    DECLARE v_is_valid_assignment BOOLEAN DEFAULT FALSE;
    DECLARE v_team_lead_id INT;
    DECLARE v_is_project_manager BOOLEAN DEFAULT FALSE;
    DECLARE v_assigner_employee_id INT;
    
    -- Get the role and employee_id of the person assigning the task
    SELECT role, employee_id INTO v_assigned_by_role, v_assigner_employee_id
    FROM users 
    WHERE user_id = p_assigned_by 
    LIMIT 1;
    
    -- Check if the assigner is the project manager for this project
    IF v_assigned_by_role = 'manager' THEN
        SELECT EXISTS (
            SELECT 1 FROM projects 
            WHERE project_id = p_project_id 
            AND project_manager_id = v_assigner_employee_id
        ) INTO v_is_project_manager;
    END IF;
    
    -- Check if assignment is valid
    IF v_assigned_by_role = 'admin' THEN
        -- Admin can assign to anyone
        SET v_is_valid_assignment = TRUE;
    ELSEIF v_assigned_by_role = 'manager' AND v_is_project_manager THEN
        -- Project manager can assign to any employee in a team assigned to their project
        SELECT EXISTS (
            SELECT 1 FROM employees e
            JOIN project_team_members pt ON e.employee_id = p_employee_id
            WHERE pt.project_id = p_project_id
        ) INTO v_is_valid_assignment;
    ELSEIF v_assigned_by_role = 'team_lead' THEN
        -- Team lead can only assign to their team members
        SELECT team_id INTO v_team_lead_id 
        FROM team_leads 
        WHERE employee_id = v_assigner_employee_id
        LIMIT 1;
        
        IF v_team_lead_id IS NOT NULL AND p_team_id = v_team_lead_id THEN
            SELECT EXISTS (
                SELECT 1 FROM employees 
                WHERE employee_id = p_employee_id 
                AND team_id = v_team_lead_id
            ) INTO v_is_valid_assignment;
        END IF;
    END IF;
    
    IF NOT v_is_valid_assignment THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'You do not have permission to assign tasks to this employee';
    END IF;
    
    -- Proceed with task creation
    INSERT INTO track_entries (
        project_id, assigned_to, assigned_by, title, 
        description, task_type, priority, status, due_date, 
        hours_spent, hours_worked, status_updated_at
    ) VALUES (
        p_project_id, p_employee_id, p_assigned_by, p_title,
        p_description, p_task_type, p_priority, p_status, p_due_date,
        p_hours_spent, 0.00, CURRENT_TIMESTAMP
    );
    
    -- Log the assignment
    INSERT INTO track_entry_history (
        track_entry_id, field_changed, old_value, new_value, changed_by, changed_at
    ) VALUES (
        LAST_INSERT_ID(), 'status', 'New', p_status, v_assigner_employee_id, CURRENT_TIMESTAMP
    );
    
    SELECT LAST_INSERT_ID() AS track_entry_id;
END;


DELIMITER //
CREATE PROCEDURE sp_GetAssignableEmployees(
    IN p_project_id INT,
    IN p_team_id INT,
    IN p_user_id INT
)
BEGIN
    DECLARE v_assigner_role VARCHAR(20);
    DECLARE v_team_lead_team_id INT;
    DECLARE v_employee_id INT;

    -- Get assigner's role and employee_id
    SELECT role, employee_id INTO v_assigner_role, v_employee_id
    FROM users 
    WHERE user_id = p_user_id 
    LIMIT 1;

    -- For team leads, get their team ID
    IF v_assigner_role = 'team_lead' THEN
        SELECT team_id INTO v_team_lead_team_id
        FROM team_leads
        WHERE employee_id = v_employee_id
        LIMIT 1;
    END IF;

    -- Admin/Manager can see all employees in the project
    IF v_assigner_role IN ('admin', 'manager') THEN
        SELECT 
            e.employee_id,
            e.first_name,
            e.last_name,
            CONCAT(e.first_name, ' ', e.last_name) AS full_name,
            e.email,
            t.name AS team_name,
            EXISTS (
                SELECT 1 FROM team_leads tl 
                WHERE tl.employee_id = e.employee_id
            ) AS is_team_lead
        FROM employees e
        JOIN teams t ON e.team_id = t.team_id
        WHERE (p_team_id IS NULL OR e.team_id = p_team_id)
        AND EXISTS (
            SELECT 1 FROM project_team_members pt 
            WHERE pt.project_id = p_project_id
            AND pt.employee_id = e.employee_id
        );

    -- Team leads can only see their team members
    ELSEIF v_assigner_role = 'team_lead' THEN
        SELECT 
            e.employee_id,
            e.first_name,
            e.last_name,
            CONCAT(e.first_name, ' ', e.last_name) AS full_name,
            e.email,
            t.name AS team_name,
            EXISTS (
                SELECT 1 FROM team_leads tl 
                WHERE tl.employee_id = e.employee_id
            ) AS is_team_lead
        FROM employees e
        JOIN teams t ON e.team_id = t.team_id
        WHERE e.team_id = v_team_lead_team_id
        AND EXISTS (
            SELECT 1 FROM project_team_members pt 
            WHERE pt.project_id = p_project_id
            AND pt.employee_id = e.employee_id
        );

    -- Customer team heads can see team members of customer teams
    ELSEIF v_assigner_role = 'customer_head' THEN
        SELECT 
            ce.customer_employee_id AS employee_id,
            ce.first_name,
            ce.last_name,
            CONCAT(ce.first_name, ' ', ce.last_name) AS full_name,
            ce.email,
            cc.name AS team_name,
            0 AS is_team_lead
        FROM customer_employees ce
        JOIN customer_companies cc ON ce.customer_company_id = cc.customer_company_id
        JOIN project_team_members pt ON ce.customer_employee_id = pt.customer_employee_id
        WHERE pt.project_id = p_project_id
        AND ce.is_head = 0;

    -- Regular employees and other roles get empty set
    ELSE
        -- Return empty result set
        SELECT 
            NULL AS employee_id,
            NULL AS first_name,
            NULL AS last_name,
            NULL AS full_name,
            NULL AS email,
            NULL AS team_name,
            NULL AS is_team_lead
        WHERE FALSE;
    END IF;
END //
DELIMITER ;

-- 4. Update Track Entry with Permission Check
DELIMITER //
CREATE PROCEDURE sp_UpdateTrackEntry(
    IN p_track_entry_id INT,
    IN p_user_id INT,  -- ID of the user making the change
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_task_type ENUM('Bug','Feature','Task','Documentation','Other'),
    IN p_priority ENUM('Low','Medium','High','Critical'),
    IN p_status ENUM('To Do','In Progress','Blocked','Done'),
    IN p_due_date DATE,
    IN p_hours_spent DECIMAL(5,2),
    IN p_hours_worked DECIMAL(5,2)
)
BEGIN
    DECLARE v_old_status VARCHAR(20);
    DECLARE v_assigned_to INT;
    DECLARE v_is_team_lead BOOLEAN;
    DECLARE v_employee_id INT;
    DECLARE v_user_role VARCHAR(20);
    
    -- Get the user's employee_id and role
    SELECT employee_id, role INTO v_employee_id, v_user_role
    FROM users 
    WHERE user_id = p_user_id 
    LIMIT 1;
    
    -- Get current status and assignment
    SELECT status, assigned_to INTO v_old_status, v_assigned_to
    FROM track_entries 
    WHERE track_entry_id = p_track_entry_id
    FOR UPDATE;
    
    -- Check if user has permission to update
    IF v_employee_id = v_assigned_to THEN
        -- Assigned employee can only update status and hours
        UPDATE track_entries
        SET 
            status = COALESCE(p_status, status),
            hours_worked = COALESCE(p_hours_worked, hours_worked),
            updated_at = CURRENT_TIMESTAMP,
            status_updated_at = CASE 
                WHEN p_status IS NOT NULL AND p_status != v_old_status 
                THEN CURRENT_TIMESTAMP 
                ELSE status_updated_at 
            END
        WHERE track_entry_id = p_track_entry_id;
    ELSE
        -- Check if user is team lead or manager
        SELECT EXISTS (
            SELECT 1 FROM team_leads tl
            JOIN employees e ON tl.team_id = e.team_id
            WHERE tl.employee_id = v_employee_id AND e.employee_id = v_assigned_to
        ) INTO v_is_team_lead;
        
        IF v_is_team_lead OR v_user_role IN ('admin', 'manager') THEN
            -- Team lead or manager can update all fields
            UPDATE track_entries
            SET 
                title = COALESCE(p_title, title),
                description = COALESCE(p_description, description),
                task_type = COALESCE(p_task_type, task_type),
                priority = COALESCE(p_priority, priority),
                status = COALESCE(p_status, status),
                due_date = COALESCE(p_due_date, due_date),
                hours_spent = COALESCE(p_hours_spent, hours_spent),
                updated_at = CURRENT_TIMESTAMP,
                status_updated_at = CASE 
                    WHEN p_status IS NOT NULL AND p_status != v_old_status 
                    THEN CURRENT_TIMESTAMP 
                    ELSE status_updated_at 
                END
            WHERE track_entry_id = p_track_entry_id;
        ELSE
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'You do not have permission to update this task';
        END IF;
    END IF;
    
    -- Log status changes
    IF p_status IS NOT NULL AND p_status != v_old_status THEN
        INSERT INTO track_entry_history (
            track_entry_id, field_changed, old_value, new_value, changed_by
        ) VALUES (
            p_track_entry_id, 'status', v_old_status, p_status, v_employee_id
        );
    END IF;
END;


DELIMITER //
CREATE PROCEDURE sp_TaskTransfer(IN p_track_entry_id INT, IN p_assigned_to INT) 
BEGIN 
    DECLARE v_assigned_to INT;
    DECLARE v_assigned_by INT;

    SELECT assigned_to, assigned_by INTO v_assigned_to, v_assigned_by
    FROM track_entries 
    WHERE track_entry_id = p_track_entry_id    ;

    UPDATE track_entries set assigned_to = p_assigned_to where track_entry_id = p_track_entry_id;

    INSERT INTO track_entry_history (
        track_entry_id, field_changed, old_value, new_value, changed_by, changed_at
    ) VALUES (
        p_track_entry_id, 'assigned_to', v_assigned_to, p_assigned_to, v_assigned_by, CURRENT_TIMESTAMP
    );
END;

-- 5. Get Track Entry with Permissions
DELIMITER //
CREATE PROCEDURE sp_GetTrackEntryById(
    IN p_track_entry_id INT,
    IN p_user_id INT
)
BEGIN
    DECLARE v_employee_role VARCHAR(20);
    DECLARE v_employee_id INT;
    
    -- Get employee's role
    SELECT u.role, u.employee_id
    INTO v_employee_role, v_employee_id
    FROM users u
    WHERE u.user_id = p_user_id;
    
    -- Return task if:
    -- 1. User is admin/manager
    -- 2. User is assigned to the task
    -- 3. User is a team lead and the task is assigned to their team
    SELECT 
        te.*,
        p.name as project_name,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        CONCAT(a.first_name, ' ', a.last_name) as assigned_by_name,
        -- Include history
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'field_changed', h.field_changed,
                    'old_value', h.old_value,
                    'new_value', h.new_value,
                    'changed_at', h.changed_at,
                    'changed_by', CONCAT(emp.first_name, ' ', emp.last_name)
                )
            )
            FROM track_entry_history h
            JOIN employees emp ON h.changed_by = emp.employee_id
            WHERE h.track_entry_id = te.track_entry_id
            ORDER BY h.changed_at DESC
        ) as change_history
    FROM track_entries te
    LEFT JOIN projects p ON te.project_id = p.project_id
    LEFT JOIN employees e ON te.assigned_to = e.employee_id
    LEFT JOIN users u_assigner ON te.assigned_by = u_assigner.user_id
    LEFT JOIN employees a ON u_assigner.employee_id = a.employee_id
    WHERE te.track_entry_id = p_track_entry_id
    AND (
        v_employee_role IN ('admin', 'manager')  -- Admin/manager can see all
        OR te.assigned_to = v_employee_id  -- Assigned employee can see their tasks
        OR (  -- Team lead can see tasks for their team
            v_employee_role = 'team_lead' 
            AND EXISTS (
                SELECT 1 FROM team_leads tl
                JOIN employees e2 ON tl.team_id = e2.team_id
                WHERE tl.employee_id = v_employee_id AND e2.employee_id = te.assigned_to
            )
        )
    );
END;

DELIMITER ;

-- Get Employee Dashboard
DELIMITER //
CREATE PROCEDURE sp_GetEmployeeDashboard(

    IN p_user_id INT
)
BEGIN
    -- Get employee's role and team
    DECLARE v_employee_role VARCHAR(20);
    DECLARE v_employee_id INT;
    
    SELECT u.role, u.employee_id
    INTO v_employee_role, v_employee_id
    FROM users u
    WHERE u.user_id = p_user_id;
    
    -- Get tasks based on role
    IF v_employee_role IN ('admin', 'manager') THEN
        -- Get all tasks for projects managed by this user
        SELECT 
            te.*,
            p.name as project_name,
            CONCAT(COALESCE(e.first_name, ''), ' ', COALESCE(e.last_name, '')) as assignee_name,
            CASE 
                WHEN ab.employee_id IS NOT NULL THEN CONCAT(ab.first_name, ' ', ab.last_name)
                WHEN u.user_id IS NOT NULL THEN u.username
                ELSE 'System'
            END as assigned_by_name,
            COALESCE(ab.first_name, '') as assigned_by_first_name,
            COALESCE(ab.last_name, '') as assigned_by_last_name,
            COALESCE(te.assigned_by, 0) as assigned_by_user_id
        FROM track_entries te
        JOIN projects p ON te.project_id = p.project_id
        LEFT JOIN employees e ON te.assigned_to = e.employee_id
        LEFT JOIN users u ON te.assigned_by = u.user_id
        LEFT JOIN employees ab ON u.employee_id = ab.employee_id
        WHERE p.project_manager_id = v_employee_id
        OR te.assigned_by = p_user_id
        ORDER BY 
            CASE te.priority
                WHEN 'Critical' THEN 1
                WHEN 'High' THEN 2
                WHEN 'Medium' THEN 3
                WHEN 'Low' THEN 4
                ELSE 5
            END,
            te.due_date ASC;
        

    ELSE
        -- Regular employee - only their tasks
        SELECT 
            te.*,
            p.name as project_name,
            CONCAT(COALESCE(e.first_name, ''), ' ', COALESCE(e.last_name, '')) as assignee_name,
            CASE 
                WHEN ab.employee_id IS NOT NULL THEN CONCAT(ab.first_name, ' ', ab.last_name)
                WHEN u.user_id IS NOT NULL THEN u.username
                ELSE 'System'
            END as assigned_by_name,
            COALESCE(ab.first_name, '') as assigned_by_first_name,
            COALESCE(ab.last_name, '') as assigned_by_last_name,
            COALESCE(te.assigned_by, 0) as assigned_by_user_id
        FROM track_entries te



        
        JOIN projects p ON te.project_id = p.project_id
        LEFT JOIN employees e ON te.assigned_to = e.employee_id
        LEFT JOIN users u ON te.assigned_by = u.user_id
        LEFT JOIN employees ab ON u.employee_id = ab.employee_id
        WHERE te.assigned_to = v_employee_id
        ORDER BY 
            CASE te.priority
                WHEN 'Critical' THEN 1
                WHEN 'High' THEN 2
                WHEN 'Medium' THEN 3
                WHEN 'Low' THEN 4
                ELSE 5
            END,
            te.due_date ASC;
    END IF;
END;

DELIMITER ;

-- Get Task Statistics
DELIMITER //
CREATE PROCEDURE sp_GetTaskStatistics(
    IN p_user_id INT,
    IN p_project_id INT
)
BEGIN
    DECLARE v_employee_role VARCHAR(20);
    DECLARE v_employee_id INT;
    
    -- Get employee's role and ID
    SELECT role, employee_id INTO v_employee_role, v_employee_id
    FROM users 
    WHERE user_id = p_user_id 
    LIMIT 1;
    
    -- Return statistics based on role and filters
    SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'To Do' THEN 1 ELSE 0 END) as todo_count,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN status = 'Blocked' THEN 1 ELSE 0 END) as blocked_count,
        SUM(CASE WHEN status = 'Done' THEN 1 ELSE 0 END) as done_count,
        SUM(hours_spent) as total_hours_spent
    FROM track_entries te
    WHERE (p_project_id IS NULL OR te.project_id = p_project_id)
    AND (
        v_employee_role IN ('admin', 'manager')
        OR (v_employee_role = 'team_lead' AND EXISTS (
            SELECT 1 FROM team_leads tl
            JOIN employees e ON tl.team_id = e.team_id
            WHERE tl.employee_id = v_employee_id AND e.employee_id = te.assigned_to
        ))
        OR te.assigned_to = v_employee_id
    );
END;

-- Create the stored procedure to get track entries with filters and pagination
DELIMITER //
CREATE PROCEDURE sp_GetTrackEntries(
    IN p_project_id INT,
    IN p_employee_id INT,
    IN p_assigned_to_me INT,
    IN p_status VARCHAR(20),
    IN p_priority VARCHAR(20),
    IN p_task_type VARCHAR(50),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    -- Get total count for pagination
    SELECT 
        COUNT(*) as total_count
    FROM track_entries te
    JOIN projects p ON te.project_id = p.project_id
    JOIN employees e ON te.assigned_to = e.employee_id
    WHERE (p_project_id IS NULL OR te.project_id = p_project_id)
      AND (p_employee_id IS NULL OR te.assigned_to = p_employee_id)
      AND (p_assigned_to_me IS NULL OR te.assigned_to = p_assigned_to_me)
      AND (p_status IS NULL OR te.status = p_status)
      AND (p_priority IS NULL OR te.priority = p_priority)
      AND (p_task_type IS NULL OR te.task_type = p_task_type)
      AND (p_start_date IS NULL OR te.due_date >= p_start_date)
      AND (p_end_date IS NULL OR te.due_date <= p_end_date);
    
    -- Get paginated results
    SELECT 
        te.track_entry_id,
        te.title,
        te.description,
        te.task_type,
        te.priority,
        te.status,
        te.due_date,
        te.hours_spent,
        te.hours_worked,
        te.created_at,
        te.updated_at,
        p.project_id,
        p.name as project_name,
        e.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        ab_user.user_id as assigned_by_id,
        CONCAT(ab.first_name, ' ', ab.last_name) as assigned_by_name
    FROM track_entries te
    JOIN projects p ON te.project_id = p.project_id
    JOIN employees e ON te.assigned_to = e.employee_id
    LEFT JOIN users ab_user ON te.assigned_by = ab_user.user_id
    LEFT JOIN employees ab ON ab_user.employee_id = ab.employee_id
    WHERE (p_project_id IS NULL OR te.project_id = p_project_id)
      AND (p_employee_id IS NULL OR te.assigned_to = p_employee_id)
      AND (p_assigned_to_me IS NULL OR te.assigned_to = p_assigned_to_me)
      AND (p_status IS NULL OR te.status = p_status)
      AND (p_priority IS NULL OR te.priority = p_priority)
      AND (p_task_type IS NULL OR te.task_type = p_task_type)
      AND (p_start_date IS NULL OR te.due_date >= p_start_date)
      AND (p_end_date IS NULL OR te.due_date <= p_end_date)
    ORDER BY te.due_date DESC, te.priority DESC
    LIMIT p_limit OFFSET p_offset;
END;

-- Update track entry status
DELIMITER //
CREATE PROCEDURE sp_UpdateTrackEntryStatus(
    IN p_track_entry_id INT,
    IN p_status ENUM('To Do','In Progress','Blocked','Done'),
    IN p_user_id INT
)
BEGIN
    DECLARE v_old_status VARCHAR(20);
    DECLARE v_assigned_to INT;
    DECLARE v_is_team_lead BOOLEAN;
    DECLARE v_employee_id INT;
    DECLARE v_user_role VARCHAR(20);
    DECLARE v_in_progress_time TIMESTAMP;
    DECLARE v_done_time TIMESTAMP;
    DECLARE v_calculated_hours DECIMAL(5,2);
    DECLARE v_exit_flag BOOLEAN DEFAULT FALSE;
    
    -- Exception handler
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Get the user's employee_id and role
    SELECT employee_id, role INTO v_employee_id, v_user_role
    FROM users 
    WHERE user_id = p_user_id 
    LIMIT 1;
    
    -- Get current status and assignment
    SELECT status, assigned_to INTO v_old_status, v_assigned_to
    FROM track_entries 
    WHERE track_entry_id = p_track_entry_id
    FOR UPDATE;
    
    -- Check if user has permission to update status
    IF v_employee_id = v_assigned_to THEN
        -- Assigned employee can update status
        SET v_exit_flag = FALSE;
    ELSE
        -- Check if user is team lead or manager
        SELECT EXISTS (
            SELECT 1 FROM team_leads tl
            JOIN employees e ON tl.team_id = e.team_id
            WHERE tl.employee_id = v_employee_id AND e.employee_id = v_assigned_to
        ) INTO v_is_team_lead;
        
        IF v_is_team_lead OR v_user_role IN ('admin', 'manager') THEN
            -- Team lead or manager can update status
            SET v_exit_flag = FALSE;
        ELSE
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'You do not have permission to update this task status';
        END IF;
    END IF;
    
    -- Calculate hours if status is changing to "Done"
    IF p_status = 'Done' AND v_old_status != 'Done' THEN
        -- Get the most recent "In Progress" timestamp for this task
        SELECT changed_at INTO v_in_progress_time
        FROM track_entry_history
        WHERE track_entry_id = p_track_entry_id 
        AND field_changed = 'status'
        AND new_value = 'In Progress'
        ORDER BY changed_at DESC
        LIMIT 1;
        
        -- If we found an "In Progress" timestamp, calculate hours
        IF v_in_progress_time IS NOT NULL THEN
            SET v_done_time = CURRENT_TIMESTAMP;
            
            -- Calculate hours between In Progress and Done
            SET v_calculated_hours = TIMESTAMPDIFF(MINUTE, v_in_progress_time, v_done_time) / 60.0;
            
            -- Update track_entries with calculated hours
            UPDATE track_entries
            SET 
                status = p_status,
                hours_spent = v_calculated_hours,
                updated_at = CURRENT_TIMESTAMP,
                status_updated_at = CURRENT_TIMESTAMP
            WHERE track_entry_id = p_track_entry_id;
        ELSE
            -- No "In Progress" found, just update status without hours calculation
            UPDATE track_entries
            SET 
                status = p_status,
                updated_at = CURRENT_TIMESTAMP,
                status_updated_at = CURRENT_TIMESTAMP
            WHERE track_entry_id = p_track_entry_id;
        END IF;
    ELSE
        -- Status is not changing to "Done", just update normally
        UPDATE track_entries
        SET 
            status = p_status,
            updated_at = CURRENT_TIMESTAMP,
            status_updated_at = CURRENT_TIMESTAMP
        WHERE track_entry_id = p_track_entry_id;
    END IF;
    
    -- Log status change in history
    INSERT INTO track_entry_history (
        track_entry_id, field_changed, old_value, new_value, changed_by
    ) VALUES (
        p_track_entry_id, 'status', v_old_status, p_status, v_employee_id
    );
    
    -- If hours were calculated, also log the hours change
    IF p_status = 'Done' AND v_calculated_hours IS NOT NULL THEN
        INSERT INTO track_entry_history (
            track_entry_id, field_changed, old_value, new_value, changed_by
        ) VALUES (
            p_track_entry_id, 'hours_spent', '0.00', CAST(v_calculated_hours AS CHAR), v_employee_id
        );
    END IF;
    
    -- Commit transaction
    COMMIT;
END;
//
DELIMITER ;

-- Update track entry hours worked
DELIMITER //
CREATE PROCEDURE sp_UpdateTrackEntryHours(
    IN p_track_entry_id INT,
    IN p_hours_worked DECIMAL(5,2),
    IN p_user_id INT
)
BEGIN
    DECLARE v_old_hours DECIMAL(5,2);
    DECLARE v_assigned_to INT;
    DECLARE v_employee_id INT;
    DECLARE v_user_role VARCHAR(20);
    
    -- Get the user's employee_id and role
    SELECT employee_id, role INTO v_employee_id, v_user_role
    FROM users 
    WHERE user_id = p_user_id 
    LIMIT 1;
    
    -- Get current hours and assignment
    SELECT hours_worked, assigned_to INTO v_old_hours, v_assigned_to
    FROM track_entries 
    WHERE track_entry_id = p_track_entry_id
    FOR UPDATE;
    
    -- Check if user has permission to update hours
    IF v_employee_id = v_assigned_to OR v_user_role IN ('admin', 'manager', 'team_lead') THEN
        -- Update hours worked
        UPDATE track_entries
        SET 
            hours_worked = p_hours_worked,
            updated_at = CURRENT_TIMESTAMP
        WHERE track_entry_id = p_track_entry_id;
        
        -- Log hours change
        INSERT INTO track_entry_history (
            track_entry_id, field_changed, old_value, new_value, changed_by
        ) VALUES (
            p_track_entry_id, 'hours_worked', v_old_hours, p_hours_worked, v_employee_id
        );
    ELSE
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'You do not have permission to update hours for this task';
    END IF;
END;

-- Delete track entry
DELIMITER //
CREATE PROCEDURE sp_DeleteTrackEntry(
    IN p_track_entry_id INT,
    IN p_user_id INT
)
BEGIN
    DECLARE v_user_role VARCHAR(20);
    
    -- Get user role
    SELECT role INTO v_user_role
    FROM users
    WHERE user_id = p_user_id;
    
    -- Only admin or manager can delete entries
    IF v_user_role IN ('admin', 'manager') THEN
        DELETE FROM track_entries
        WHERE track_entry_id = p_track_entry_id;
    ELSE
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Only administrators or managers can delete tasks';
    END IF;
END;

-- Get track entries by assigned_by
DELIMITER //
CREATE PROCEDURE sp_GetTrackEntriesByAssignedBy(
    IN p_assigned_by INT,
    IN p_user_id INT,
    IN p_project_id INT,
    IN p_status VARCHAR(20),
    IN p_priority VARCHAR(20),
    IN p_task_type VARCHAR(50),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_requester_role VARCHAR(20);
    DECLARE v_employee_id INT;
    
    -- Get requester's role and employee_id
    SELECT role, employee_id INTO v_requester_role, v_employee_id
    FROM users 
    WHERE user_id = p_user_id 
    LIMIT 1;
    
    -- Get results - simplified without pagination
    SELECT 
        te.track_entry_id,
        te.title,
        te.description,
        te.task_type,
        te.priority,
        te.status,
        te.due_date,
        te.hours_spent,
        te.hours_worked,
        te.created_at,
        te.updated_at,
        p.project_id,
        p.name as project_name,
        e.employee_id as assigned_to,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        te.assigned_by as assigned_by_id,
        CONCAT(ab.first_name, ' ', ab.last_name) as assigned_by_name
    FROM track_entries te
    JOIN projects p ON te.project_id = p.project_id
    JOIN employees e ON te.assigned_to = e.employee_id
    LEFT JOIN users ab_user ON te.assigned_by = ab_user.user_id
    LEFT JOIN employees ab ON ab_user.employee_id = ab.employee_id
    WHERE te.assigned_by = p_assigned_by
      AND (p_project_id IS NULL OR te.project_id = p_project_id)
      AND (p_status IS NULL OR te.status = p_status)
      AND (p_priority IS NULL OR te.priority = p_priority)
      AND (p_task_type IS NULL OR te.task_type = p_task_type)
      AND (p_start_date IS NULL OR te.due_date >= p_start_date)
      AND (p_end_date IS NULL OR te.due_date <= p_end_date)
    ORDER BY te.due_date DESC, te.priority DESC;
END;

-- Get track entries by assigned_to
DELIMITER //
CREATE PROCEDURE sp_GetTrackEntriesByAssignedTo(
    IN p_assigned_to INT,
    IN p_user_id INT,
    IN p_project_id INT,
    IN p_status VARCHAR(20),
    IN p_priority VARCHAR(20),
    IN p_task_type VARCHAR(50),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_limit INT,
    IN p_offset INT
)   
BEGIN
    DECLARE v_requester_role VARCHAR(20);
    DECLARE v_employee_id INT;
    
    -- Get requester's role and employee_id
    SELECT role, employee_id INTO v_requester_role, v_employee_id
    FROM users 
    WHERE user_id = p_user_id 
    LIMIT 1;
    
    -- Get total count for pagination
    SELECT 
        COUNT(*) as total_count
    FROM track_entries te
    JOIN projects p ON te.project_id = p.project_id
    JOIN employees e ON te.assigned_to = e.employee_id
    WHERE te.assigned_to = p_assigned_to
      AND (
        -- Access control: Only admin/manager can see all, team lead can see their team, employee can see their tasks
        v_requester_role IN ('admin', 'manager')
        OR (v_requester_role = 'team_lead' AND EXISTS (
            SELECT 1 FROM team_leads tl
            JOIN employees e2 ON tl.team_id = e2.team_id
            WHERE tl.employee_id = v_employee_id AND e2.employee_id = te.assigned_to
        ))
        OR te.assigned_to = v_employee_id
        OR te.assigned_by = p_user_id
      )
      AND (p_project_id IS NULL OR te.project_id = p_project_id)
      AND (p_status IS NULL OR te.status = p_status)
      AND (p_priority IS NULL OR te.priority = p_priority)
      AND (p_task_type IS NULL OR te.task_type = p_task_type)
      AND (p_start_date IS NULL OR te.due_date >= p_start_date)
      AND (p_end_date IS NULL OR te.due_date <= p_end_date);
    
    -- Get paginated results
    SELECT 
        te.track_entry_id,
        te.title,
        te.description,
        te.task_type,
        te.priority,
        te.status,
        te.due_date,
        te.hours_spent,
        te.hours_worked,
        te.created_at,
        te.updated_at,
        p.project_id,
        p.name as project_name,
        e.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        ab_user.user_id as assigned_by_id,
        CONCAT(ab.first_name, ' ', ab.last_name) as assigned_by_name
    FROM track_entries te
    JOIN projects p ON te.project_id = p.project_id
    JOIN employees e ON te.assigned_to = e.employee_id
    LEFT JOIN users ab_user ON te.assigned_by = ab_user.user_id
    LEFT JOIN employees ab ON ab_user.employee_id = ab.employee_id
    WHERE te.assigned_to = p_assigned_to
      AND (
        -- Access control: Only admin/manager can see all, team lead can see their team, employee can see their tasks
        v_requester_role IN ('admin', 'manager')
        OR (v_requester_role = 'team_lead' AND EXISTS (
            SELECT 1 FROM team_leads tl
            JOIN employees e2 ON tl.team_id = e2.team_id
            WHERE tl.employee_id = v_employee_id AND e2.employee_id = te.assigned_to
        ))
        OR te.assigned_to = v_employee_id
        OR te.assigned_by = p_user_id
      )
      AND (p_project_id IS NULL OR te.project_id = p_project_id)
      AND (p_status IS NULL OR te.status = p_status)
      AND (p_priority IS NULL OR te.priority = p_priority)
      AND (p_task_type IS NULL OR te.task_type = p_task_type)
      AND (p_start_date IS NULL OR te.due_date >= p_start_date)
      AND (p_end_date IS NULL OR te.due_date <= p_end_date)
    ORDER BY te.due_date DESC, te.priority DESC
    LIMIT p_limit OFFSET p_offset;
END;

DELIMITER //

DELIMITER //

CREATE PROCEDURE sp_GetProjectManagerTasks(
    IN p_manager_id INT
)
BEGIN
    SELECT 
        te.track_entry_id,
        te.title,
        te.description,
        te.task_type,
        te.priority,
        te.status,
        te.due_date,
        te.hours_spent,
        te.hours_worked,
        te.created_at,
        te.updated_at,
        p.project_id,
        p.name AS project_name,
        e.employee_id AS assigned_to_id,
        CONCAT(e.first_name, ' ', e.last_name) AS assigned_to_name,
        COALESCE(
            CONCAT(emp_assigner.first_name, ' ', emp_assigner.last_name),
            CONCAT(cust_assigner.first_name, ' ', cust_assigner.last_name)
        ) AS assigned_by_name,
        t.team_id,
        t.name AS team_name
    FROM track_entries te
    JOIN projects p ON te.project_id = p.project_id
    JOIN employees e ON te.assigned_to = e.employee_id
    LEFT JOIN teams t ON e.team_id = t.team_id
    LEFT JOIN users u ON te.assigned_by = u.user_id
    LEFT JOIN employees emp_assigner ON u.employee_id = emp_assigner.employee_id
    LEFT JOIN customer_employees cust_assigner ON u.customer_id = cust_assigner.customer_employee_id
    WHERE p.project_manager_id = p_manager_id
    ORDER BY te.due_date DESC, te.priority DESC;
END //

DELIMITER ;

-- Get team tasks for team leads
DELIMITER //
CREATE PROCEDURE sp_GetTeamLeadTasks(
    IN p_team_lead_id INT
)
BEGIN
    -- Get all tasks assigned to employees in teams led by this team lead
    SELECT 
        te.track_entry_id,
        te.title,
        te.description,
        te.task_type,
        te.priority,
        te.status,
        te.due_date,
        te.hours_spent,
        te.hours_worked,
        te.created_at,
        te.updated_at,
        p.project_id,
        p.name as project_name,
        e.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        ab_user.user_id as assigned_by_id,
        CONCAT(ab.first_name, ' ', ab.last_name) as assigned_by_name,
        t.team_id,
        t.name as team_name
    FROM track_entries te
    JOIN employees e ON te.assigned_to = e.employee_id
    JOIN teams t ON e.team_id = t.team_id
    JOIN team_leads tl ON t.team_id = tl.team_id
    JOIN projects p ON te.project_id = p.project_id
    LEFT JOIN users ab_user ON te.assigned_by = ab_user.user_id
    LEFT JOIN employees ab ON ab_user.employee_id = ab.employee_id
    WHERE tl.employee_id = p_team_lead_id
    ORDER BY te.due_date DESC, te.priority DESC;
END //
DELIMITER ;