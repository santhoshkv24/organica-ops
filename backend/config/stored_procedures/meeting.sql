-- ============================
-- MEETINGS
-- ============================

-- Get all meetings
CREATE PROCEDURE sp_GetAllMeetings()
BEGIN
    SELECT 
        m.*,
        CONCAT(e.first_name, ' ', e.last_name) AS scheduled_by_name,
        t.name AS team_name,
        p.name AS project_name
    FROM meetings m
    LEFT JOIN employees e ON m.scheduled_by = e.employee_id
    LEFT JOIN teams t ON m.team_id = t.team_id
    LEFT JOIN projects p ON m.project_id = p.project_id
    ORDER BY m.start_datetime;
END;

-- Get meeting by ID
CREATE PROCEDURE sp_GetMeetingById(IN p_meeting_id INT)
BEGIN
    SELECT 
        m.*,
        CONCAT(e.first_name, ' ', e.last_name) AS scheduled_by_name,
        t.name AS team_name,
        p.name AS project_name
    FROM meetings m
    LEFT JOIN employees e ON m.scheduled_by = e.employee_id
    LEFT JOIN teams t ON m.team_id = t.team_id
    LEFT JOIN projects p ON m.project_id = p.project_id
    WHERE m.meeting_id = p_meeting_id;
END;

-- Create new meeting
CREATE PROCEDURE sp_CreateMeeting(
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_scheduled_by INT,
    IN p_team_id INT,
    IN p_project_id INT,
    IN p_start_datetime DATETIME,
    IN p_end_datetime DATETIME,
    IN p_location_or_link VARCHAR(255)
)
BEGIN
    INSERT INTO meetings (title, description, scheduled_by, team_id, project_id, start_datetime, end_datetime, location_or_link)
    VALUES (p_title, p_description, p_scheduled_by, p_team_id, p_project_id, p_start_datetime, p_end_datetime, p_location_or_link);

    SELECT LAST_INSERT_ID() AS meeting_id;
END;

-- Update meeting
CREATE PROCEDURE sp_UpdateMeeting(
    IN p_meeting_id INT,
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_team_id INT,
    IN p_project_id INT,
    IN p_start_datetime DATETIME,
    IN p_end_datetime DATETIME,
    IN p_location_or_link VARCHAR(255)
)
BEGIN
    UPDATE meetings
    SET title = p_title,
        description = p_description,
        team_id = p_team_id,
        project_id = p_project_id,
        start_datetime = p_start_datetime,
        end_datetime = p_end_datetime,
        location_or_link = p_location_or_link
    WHERE meeting_id = p_meeting_id;
END;

-- Delete meeting
CREATE PROCEDURE sp_DeleteMeeting(IN p_meeting_id INT)
BEGIN
    -- First delete all participants
    DELETE FROM meeting_participants WHERE meeting_id = p_meeting_id;
    -- Then delete the meeting
    DELETE FROM meetings WHERE meeting_id = p_meeting_id;
    SELECT ROW_COUNT() AS deleted_rows;
END;



-- Add participant to meeting
CREATE PROCEDURE sp_AddMeetingParticipant(
    IN p_meeting_id INT,
    IN p_employee_id INT
)
BEGIN
    -- Check if the participant already exists
    IF NOT EXISTS (
        SELECT 1 FROM meeting_participants 
        WHERE meeting_id = p_meeting_id AND employee_id = p_employee_id
    ) THEN
        INSERT INTO meeting_participants (meeting_id, employee_id)
        VALUES (p_meeting_id, p_employee_id);
    END IF;
    
    SELECT LAST_INSERT_ID() AS participant_id;
END;

-- Remove participant from meeting
CREATE PROCEDURE sp_RemoveMeetingParticipant(
    IN p_meeting_id INT,
    IN p_employee_id INT
)
BEGIN
    DELETE FROM meeting_participants 
    WHERE meeting_id = p_meeting_id AND employee_id = p_employee_id;
    
    SELECT ROW_COUNT() AS deleted_rows;
END;

-- Remove all participants from a meeting
CREATE PROCEDURE sp_RemoveAllMeetingParticipants(IN p_meeting_id INT)
BEGIN
    DELETE FROM meeting_participants WHERE meeting_id = p_meeting_id;
    SELECT ROW_COUNT() AS deleted_rows;
END;

-- Get meetings by team
CREATE PROCEDURE sp_GetMeetingsByTeam(IN p_team_id INT)
BEGIN
    SELECT 
        m.*,
        CONCAT(e.first_name, ' ', e.last_name) AS scheduled_by_name,
        p.name AS project_name
    FROM meetings m
    LEFT JOIN employees e ON m.scheduled_by = e.employee_id
    LEFT JOIN projects p ON m.project_id = p.project_id
    WHERE m.team_id = p_team_id
    ORDER BY m.start_datetime;
END;

-- Get meetings by project
CREATE PROCEDURE sp_GetMeetingsByProject(IN p_project_id INT)
BEGIN
    SELECT 
        m.*,
        CONCAT(e.first_name, ' ', e.last_name) AS scheduled_by_name,
        t.name AS team_name
    FROM meetings m
    LEFT JOIN employees e ON m.scheduled_by = e.employee_id
    LEFT JOIN teams t ON m.team_id = t.team_id
    WHERE m.project_id = p_project_id
    ORDER BY m.start_datetime;
END;

-- Get meetings by date range
CREATE PROCEDURE sp_GetMeetingsByDateRange(
    IN p_start_date DATETIME,
    IN p_end_date DATETIME
)
BEGIN
    SELECT 
        m.*,
        CONCAT(e.first_name, ' ', e.last_name) AS scheduled_by_name,
        t.name AS team_name,
        p.name AS project_name
    FROM meetings m
    LEFT JOIN employees e ON m.scheduled_by = e.employee_id
    LEFT JOIN teams t ON m.team_id = t.team_id
    LEFT JOIN projects p ON m.project_id = p.project_id
    WHERE 
        (m.start_datetime BETWEEN p_start_date AND p_end_date)
        OR (m.end_datetime BETWEEN p_start_date AND p_end_date)
        OR (m.start_datetime <= p_start_date AND m.end_datetime >= p_end_date)
    ORDER BY m.start_datetime;
END;

-- ============================
-- MEETING PARTICIPANTS
-- ============================

-- Get all participants for a meeting
CREATE PROCEDURE sp_GetMeetingParticipants(IN p_meeting_id INT)
BEGIN
    SELECT 
        mp.*,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.email,
        e.position
    FROM meeting_participants mp
    JOIN employees e ON mp.employee_id = e.employee_id
    WHERE mp.meeting_id = p_meeting_id;
END;

CREATE PROCEDURE sp_GetEmployeeMeetings(IN p_employee_id INT)
BEGIN
    SELECT 
        m.*,
        CONCAT(e.first_name, ' ', e.last_name) AS scheduled_by_name,
        t.name AS team_name,
        p.name AS project_name
    FROM meeting_participants mp
    JOIN meetings m ON mp.meeting_id = m.meeting_id
    LEFT JOIN employees e ON m.scheduled_by = e.employee_id
    LEFT JOIN teams t ON m.team_id = t.team_id
    LEFT JOIN projects p ON m.project_id = p.project_id
    WHERE mp.employee_id = p_employee_id
    ORDER BY m.start_datetime;
END;
