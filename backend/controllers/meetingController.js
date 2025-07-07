const { query, getOne, insert, update, remove, callProcedure, getOneProcedure, beginTransaction, commit, rollback } = require('../utils/dbUtils');
const { getConnection } = require('../config/database');

// Get all meetings
const getMeetings = async (req, res) => {
  try {
    const meetings = await callProcedure('sp_GetAllMeetings', []);
    
    res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings
    });
  } catch (error) {
    console.error('Error getting meetings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single meeting
const getMeeting = async (req, res) => {
  try {
    const meeting = await getOneProcedure('sp_GetMeetingById', [req.params.id]);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    // Get participants for the meeting
    const participants = await callProcedure('sp_GetMeetingParticipants', [req.params.id]);
    
    // Convert dates to local timezone
    const formatMeetingDate = (dateString) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      return date.toISOString();
    };
    
    res.status(200).json({
      success: true,
      data: {
        ...meeting,
        start_datetime: formatMeetingDate(meeting.start_datetime),
        end_datetime: formatMeetingDate(meeting.end_datetime),
        participants: participants || []
      }
    });
  } catch (error) {
    console.error('Error getting meeting:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create meeting
const createMeeting = async (req, res) => {
  let connection;
  
  try {
    const {
      title,
      description,
      scheduled_by,
      team_id,
      project_id,
      start_datetime,
      end_datetime,
      location_or_link,
      participants = []
    } = req.body;

    // Get a connection and start transaction
    connection = await beginTransaction();

    try {
      // Check if team exists if team_id is provided
      if (team_id) {
        const team = await getOneProcedure('sp_GetTeamById', [team_id], connection);
        if (!team) {
          await connection.rollback();
          return res.status(404).json({ message: 'Team not found' });
        }
      }

      // Check if project exists if project_id is provided
      if (project_id) {
        const project = await getOneProcedure('sp_GetProjectById', [project_id], connection);
        if (!project) {
          await connection.rollback();
          return res.status(404).json({ message: 'Project not found' });
        }
      }

      // Format dates for MySQL (YYYY-MM-DD HH:MM:SS)
      const formatDateForMySQL = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toISOString().slice(0, 19).replace('T', ' ');
      };

      const formattedStartDatetime = formatDateForMySQL(start_datetime);
      const formattedEndDatetime = formatDateForMySQL(end_datetime);

      // Create meeting using stored procedure
      const result = await callProcedure('sp_CreateMeeting', [
        title,
        description,
        scheduled_by || req.user.employee_id, // Use the current user if not specified
        team_id || null,
        project_id || null,
        formattedStartDatetime,
        formattedEndDatetime,
        location_or_link || ''
      ], connection);

      const meetingId = result[0]?.meeting_id;
      if (!meetingId) {
        throw new Error('Failed to create meeting: No meeting ID returned');
      }

      // Add participants
      console.log('Participants to add:', participants);
      if (Array.isArray(participants) && participants.length > 0) {
        for (const participantId of participants) {
          try {
            console.log('Processing participant ID:', participantId);
            // Check if employee exists
            const employee = await getOneProcedure('sp_GetEmployeeById', [participantId], connection);
            if (!employee) {
              console.log('Employee not found with ID:', participantId);
              continue; // Skip invalid participants
            }
            
            console.log('Adding participant:', participantId, 'to meeting:', meetingId);
            await callProcedure('sp_AddMeetingParticipant', [meetingId, participantId], connection);
          } catch (error) {
            console.error('Error adding participant:', error);
            // Don't throw here, continue with other participants
          }
        }
      }

      // Commit the transaction
      await commit(connection);
      connection = null; // Set to null to prevent release in finally block

      // Get the created meeting with participants using a new connection
      const meeting = await getOneProcedure('sp_GetMeetingById', [meetingId]);
      const participantsList = await callProcedure('sp_GetMeetingParticipants', [meetingId]);
      meeting.participants = participantsList || [];

      res.status(201).json({
        success: true,
        data: meeting
      });
      
    } catch (error) {
      // Rollback the transaction in case of error
      if (connection) {
        await rollback(connection);
        connection = null; // Set to null to prevent release in finally block
      }
      console.error('Error in createMeeting transaction:', error);
      throw error; // Re-throw to be caught by the outer try-catch
    }
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create meeting',
      error: error.message 
    });
  } finally {
    // Release the connection back to the pool if it wasn't committed or rolled back
    if (connection) {
      try {
        await connection.release();
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError);
      }
    }
  }
};

// Format dates for MySQL (YYYY-MM-DD HH:MM:SS) with timezone handling
const formatDateForMySQL = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  
  // Get the timezone offset in minutes and convert to hours
  const tzOffset = date.getTimezoneOffset() * 60000;
  
  // Create a new date with the timezone offset applied
  const localDate = new Date(date.getTime() - tzOffset);
  
  // Format as YYYY-MM-DD HH:MM:SS
  return localDate.toISOString().slice(0, 19).replace('T', ' ');
};

// Function to convert MySQL datetime string to local timezone
const convertToLocalTime = (mysqlDateTime) => {
  if (!mysqlDateTime) return null;
  
  // Create a date object from the MySQL datetime string (assumes UTC)
  const date = new Date(mysqlDateTime);
  
  // Apply the timezone offset to get local time
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() + tzOffset);
  
  return localDate;
};

// Update meeting
const updateMeeting = async (req, res) => {
  let connection;
  
  try {
    const {
      title,
      description,
      team_id,
      project_id,
      start_datetime,
      end_datetime,
      location_or_link,
      participants = []
    } = req.body;

    // Get a connection and start transaction
    connection = await beginTransaction();

    try {
      // Check if meeting exists
      const existingMeeting = await getOneProcedure('sp_GetMeetingById', [req.params.id], connection);
      if (!existingMeeting) {
        await connection.rollback();
        return res.status(404).json({ message: 'Meeting not found' });
      }

      // Check if team exists
      if (team_id) {
        const team = await getOneProcedure('sp_GetTeamById', [team_id], connection);
        if (!team) {
          await connection.rollback();
          return res.status(404).json({ message: 'Team not found' });
        }
      }

      // Check if project exists
      if (project_id) {
        const project = await getOneProcedure('sp_GetProjectById', [project_id], connection);
        if (!project) {
          await connection.rollback();
          return res.status(404).json({ message: 'Project not found' });
        }
      }

      // Update meeting using stored procedure
      await callProcedure('sp_UpdateMeeting', [
        req.params.id,
        title,
        description,
        team_id || null,
        project_id || null,
        formatDateForMySQL(start_datetime),
        formatDateForMySQL(end_datetime),
        location_or_link
      ], connection);

      // Update participants if provided
      console.log('Updating participants:', participants);
      if (Array.isArray(participants)) {
        // Get current participants
        const currentParticipants = await callProcedure('sp_GetMeetingParticipants', [req.params.id], connection);
        const currentIds = currentParticipants.map(p => p.employee_id.toString());
        const newParticipantIds = participants.map(id => id.toString());
        
        // Find participants to remove (in current but not in new)
        const participantsToRemove = currentParticipants.filter(
          p => !newParticipantIds.includes(p.employee_id.toString())
        );
        
        // Find participants to add (in new but not in current)
        const participantsToAdd = newParticipantIds.filter(
          id => !currentIds.includes(id)
        );
        
        // Remove participants that are no longer in the list
        for (const participant of participantsToRemove) {
          console.log('Removing participant:', participant.employee_id, 'from meeting:', req.params.id);
          await callProcedure('sp_RemoveMeetingParticipant', [req.params.id, participant.employee_id], connection);
        }
        
        // Add new participants
        for (const participantId of participantsToAdd) {
          console.log('Adding participant:', participantId, 'to meeting:', req.params.id);
          // Check if employee exists
          const employee = await getOneProcedure('sp_GetEmployeeById', [participantId], connection);
          if (!employee) {
            console.log('Employee not found with ID:', participantId);
            continue; // Skip invalid participants
          }
          
          await callProcedure('sp_AddMeetingParticipant', [req.params.id, participantId], connection);
        }
      }
      
      // Commit the transaction
      await connection.commit();
      
      // Get the updated meeting with participants
      const updatedMeeting = await getOneProcedure('sp_GetMeetingById', [req.params.id]);
      const participantsList = await callProcedure('sp_GetMeetingParticipants', [req.params.id]);
      updatedMeeting.participants = participantsList || [];
      
      res.status(200).json({
        success: true,
        data: updatedMeeting
      });
      
    } catch (error) {
      // Rollback the transaction in case of error
      if (connection) {
        await connection.rollback();
        connection = null; // Set to null to prevent release in finally block
      }
      console.error('Error updating meeting:', error);
      throw error; // Re-throw to be caught by the outer try-catch
    }
  } catch (error) {
    console.error('Error in updateMeeting:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  } finally {
    // Release the connection back to the pool if it wasn't committed or rolled back
    if (connection) {
      try {
        await connection.release();
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError);
      }
    }
  }
};

// Delete meeting
const deleteMeeting = async (req, res) => {
  let connection;
  
  try {
    // Get a connection and start transaction
    connection = await beginTransaction();
    
    try {
      // Check if meeting exists
      const meeting = await getOneProcedure('sp_GetMeetingById', [req.params.id], connection);
      if (!meeting) {
        await rollback(connection);
        return res.status(404).json({ 
          success: false,
          message: 'Meeting not found' 
        });
      }

      // First, delete all participants (if any)
      await callProcedure('sp_RemoveAllMeetingParticipants', [req.params.id], connection);
      
      // Then delete the meeting
      await callProcedure('sp_DeleteMeeting', [req.params.id], connection);
      
      // Commit the transaction
      await commit(connection);
      connection = null; // Set to null to prevent release in finally block
      
      res.status(200).json({
        success: true,
        data: {}
      });
      
    } catch (error) {
      // Rollback the transaction in case of error
      if (connection) {
        await rollback(connection);
        connection = null; // Set to null to prevent release in finally block
      }
      console.error('Error in deleteMeeting transaction:', error);
      throw error; // Re-throw to be caught by the outer try-catch
    }
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete meeting',
      error: error.message 
    });
  } finally {
    // Release the connection back to the pool if it wasn't committed or rolled back
    if (connection) {
      try {
        await connection.release();
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError);
      }
    }
  }
};

// Get meetings by team
const getMeetingsByTeam = async (req, res) => {
  try {
    const meetings = await callProcedure('sp_GetMeetingsByTeam', [req.params.teamId]);
    
    res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings
    });
  } catch (error) {
    console.error('Error getting team meetings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get meetings by project
const getMeetingsByProject = async (req, res) => {
  try {
    const meetings = await callProcedure('sp_GetMeetingsByProject', [req.params.projectId]);
    
    res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings
    });
  } catch (error) {
    console.error('Error getting project meetings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get meetings by date range
const getMeetingsByDateRange = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const meetings = await callProcedure('sp_GetMeetingsByDateRange', [start_date, end_date]);
    
    res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings
    });
  } catch (error) {
    console.error('Error getting meetings by date range:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get meetings for an employee
const getEmployeeMeetings = async (req, res) => {
  try {
    const employeeId = req.params.employeeId || req.user.employee_id;
    const meetings = await callProcedure('sp_GetEmployeeMeetings', [employeeId]);
    
    res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings
    });
  } catch (error) {
    console.error('Error getting employee meetings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add participant to meeting
const addParticipant = async (req, res) => {
  try {
    const { meeting_id, employee_id } = req.body;
    
    // Check if meeting exists
    const meeting = await getOneProcedure('sp_GetMeetingById', [meeting_id]);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    // Check if employee exists
    const employee = await getOneProcedure('sp_GetEmployeeById', [employee_id]);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Add participant
    const result = await callProcedure('sp_AddMeetingParticipant', [meeting_id, employee_id]);
    
    res.status(200).json({
      success: true,
      data: { id: result[0]?.id }
    });
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove participant from meeting
const removeParticipant = async (req, res) => {
  try {
    const { meeting_id, employee_id } = req.body;
    
    // Check if meeting exists
    const meeting = await getOneProcedure('sp_GetMeetingById', [meeting_id]);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    // Remove participant
    await callProcedure('sp_RemoveMeetingParticipant', [meeting_id, employee_id]);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getMeetingsByTeam,
  getMeetingsByProject,
  getMeetingsByDateRange,
  getEmployeeMeetings,
  addParticipant,
  removeParticipant
}; 