import React, { useState, useEffect } from 'react';
import { 
  CCard, CCardBody, CCardHeader, CRow, CCol, CButton, CForm,
  CFormInput, CFormTextarea, CFormSelect, CSpinner, CModal, CModalHeader, 
  CModalTitle, CModalBody, CModalFooter, CAlert, CFormFloating, 
  CInputGroup, CBadge, CAvatar
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { 
  cilPlus, cilPencil, cilTrash, cilCalendar, cilPeople, cilBriefcase, 
  cilSearch, cilX 
} from '@coreui/icons';
import { Calendar, Views } from 'react-big-calendar';
import { dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours, isBefore } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Button from '@mui/material/Button';

import {
  getMeetings,
  getMeetingsByDateRange,
  getMeetingsByProject,
  getMeetingsByTeam,
  getEmployeeMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  addMeetingParticipant,
  removeMeetingParticipant,
  getProjects,
  getTeams,
  getEmployees
} from '../../services/api';
import { validateForm, validationSchemas } from '../../utils/formValidation';
import { useAuth } from '../../contexts/AuthContext';
import { toLocalDate, formatDate, toISOLocal } from '../../utils/dateUtils';

// Setup date-fns localizer for big calendar
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
});

// Style for calendar events
const eventStyleGetter = (event) => {
  const now = new Date();
  const isPast = new Date(event.end) < now;
  const isCurrent = new Date(event.start) <= now && new Date(event.end) >= now;
  
  let style = {
    backgroundColor: '#0d6efd', // Default blue
    borderRadius: '4px',
    opacity: isPast ? 0.7 : 1,
    color: 'white',
    border: '0',
    display: 'block',
    padding: '2px 8px',
    fontSize: '0.875rem',
  };
  
  if (isCurrent) {
    style.backgroundColor = '#198754'; // Green for current events
  } else if (isPast) {
    style.backgroundColor = '#6c757d'; // Gray for past events
  }
  
  return {
    style
  };
};

const Meetings = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [meetingModalVisible, setMeetingModalVisible] = useState(false);
  const [viewOnlyModalVisible, setViewOnlyModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formSuccess, setFormSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [calendarView, setCalendarView] = useState(Views.MONTH);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [filter, setFilter] = useState({
    project_id: '',
    team_id: '',
    employee_id: user?.employee_id || ''
  });

  // Form fields for meeting creation/editing
  const [formValues, setFormValues] = useState({
    title: '',
    description: '',
    start_datetime: new Date(),
    end_datetime: addHours(new Date(), 1),
    location_or_link: '',
    participants: []
  });

  // Check if user is a project manager
  const isProjectManager = user?.role === 'manager' || user?.role === 'admin';

  // Fetch meetings, projects, teams, employees data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch projects and teams - only needed for filters
        const projectRes = await getProjects();
        setProjects(projectRes.data.data || projectRes.data);
        
        const teamRes = await getTeams();
        setTeams(teamRes.data.data || teamRes.data);
        
        // Fetch employees
        const employeeRes = await getEmployees();
        setEmployees(employeeRes.data.data || employeeRes.data);
        
        // Set default filter based on user
        let defaultFilter = { ...filter };
        
        // If regular employee, always filter to only show their meetings
        if (user?.role === 'employee' && user?.employee_id) {
          defaultFilter.employee_id = user.employee_id;
        }
        
        // Fetch meetings based on the filter
        await fetchMeetings(defaultFilter);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Convert meetings to calendar events with proper timezone handling
  useEffect(() => {
    const events = meetings.map(meeting => {
      // Convert to local timezone for display
      const start = toLocalDate(meeting.start_datetime);
      const end = toLocalDate(meeting.end_datetime);
      
      return {
        id: meeting.meeting_id,
        title: meeting.title,
        start,
        end,
        location: meeting.location_or_link,
        description: meeting.description,
        participants: meeting.participants || [],
        meeting: {
          ...meeting,
          start_datetime: start,
          end_datetime: end
        }
      };
    });
    
    setCalendarEvents(events);
  }, [meetings]);

  // Fetch meetings based on selected filters and date range
  const fetchMeetings = async (currentFilter = filter, start = null, end = null) => {
    try {
      setLoading(true);
      let response;
      
      // For regular employees, only show their meetings
      if (user?.role === 'employee' && user?.employee_id) {
        response = await getEmployeeMeetings(user.employee_id);
      } else if (currentFilter.project_id) {
        // Fetch meetings by project
        response = await getMeetingsByProject(currentFilter.project_id);
      } else if (currentFilter.team_id) {
        // Fetch meetings by team
        response = await getMeetingsByTeam(currentFilter.team_id);
      } else if (currentFilter.employee_id) {
        // Fetch meetings for employee
        response = await getEmployeeMeetings(currentFilter.employee_id);
      } else if (start && end) {
        // If date range is provided
        const formattedStartDate = format(start, 'yyyy-MM-dd');
        const formattedEndDate = format(end, 'yyyy-MM-dd');
        
        // Fetch meetings for date range
        response = await getMeetingsByDateRange(formattedStartDate, formattedEndDate);
      } else {
        // Default: get all meetings
        response = await getMeetings();
      }
      
      setMeetings(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter change - only available for managers/admins
  const handleFilterChange = (name, value) => {
    // Don't allow employees to change filters
    if (user?.role === 'employee') return;
    
    const newFilter = { ...filter, [name]: value };
    
    // Reset other filters when one is selected
    if (name === 'project_id' && value) {
      newFilter.team_id = '';
      newFilter.employee_id = '';
    } else if (name === 'team_id' && value) {
      newFilter.project_id = '';
      newFilter.employee_id = '';
    } else if (name === 'employee_id' && value) {
      newFilter.project_id = '';
      newFilter.team_id = '';
    }
    
    setFilter(newFilter);
    fetchMeetings(newFilter);
  };
  
  // Handle calendar range change (when user navigates to different month/week/day)
  const handleRangeChange = ({ start, end }) => {
    // Only fetch based on date range if no other filters are active
    if (!filter.project_id && !filter.team_id && !filter.employee_id) {
      fetchMeetings(filter, start, end);
    }
  };

  // Handle calendar view change (month, week, day)
  const handleViewChange = (view) => {
    setCalendarView(view);
  };

  // Handle calendar date change
  const handleNavigate = (date) => {
    setCalendarDate(date);
  };

  // Handle clicking the "Add Meeting" button
  const handleAddMeetingClick = () => {
    if (!isProjectManager) return; // Only project managers can add meetings
    
    const now = new Date();
    // Round to nearest 15 minutes
    const roundedMinutes = Math.ceil(now.getMinutes() / 15) * 15;
    const startDate = new Date(now);
    startDate.setMinutes(roundedMinutes, 0, 0);
    
    setFormValues({
      title: '',
      description: '',
      start_datetime: startDate,
      end_datetime: addHours(startDate, 1),
      location_or_link: '',
      participants: []
    });
    setFormErrors({});
    setFormSuccess('');
    setIsEditMode(false);
    setMeetingModalVisible(true);
  };
  
  // Handle clicking on an event to view meeting details
  const handleSelectEvent = (event) => {
    // The event object contains a meeting property with the full meeting data
    setSelectedMeeting(event.meeting);
    setViewOnlyModalVisible(true);
  };
  
  // Handle clicking on a time slot in the calendar to create a new meeting
  const handleSelectSlot = ({ start, end }) => {
    if (!isProjectManager) return; // Only project managers can add meetings
    
    // Round start time to nearest 15 minutes
    const roundedMinutes = Math.ceil(start.getMinutes() / 15) * 15;
    const startDate = new Date(start);
    startDate.setMinutes(roundedMinutes, 0, 0);
    
    setFormValues({
      title: '',
      description: '',
      start_datetime: startDate,
      end_datetime: addHours(startDate, 1),
      location_or_link: '',
      participants: []
    });
    
    setFormErrors({});
    setFormSuccess('');
    setIsEditMode(false);
    setMeetingModalVisible(true);
  };
  
  // Handle clicking the edit button from the view modal
  const handleEditMeeting = () => {
    if (!selectedMeeting) return;
    
    setFormValues({
      title: selectedMeeting.title,
      description: selectedMeeting.description || '',
      start_datetime: toLocalDate(selectedMeeting.start_datetime),
      end_datetime: toLocalDate(selectedMeeting.end_datetime),
      location_or_link: selectedMeeting.location_or_link,
      participants: selectedMeeting.participants?.map(p => p.employee_id?.toString()) || []
    });
    
    setViewOnlyModalVisible(false);
    setFormErrors({});
    setFormSuccess('');
    setIsEditMode(true);
    setMeetingModalVisible(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle date/time change with timezone handling
  const handleDateTimeChange = (date, field) => {
    if (!date) return;
    
    // Ensure we're working with a Date object
    const newDate = new Date(date);
    
    setFormValues(prev => {
      const updated = {
        ...prev,
        [field]: newDate
      };
      
      // If changing start time and end time is before new start time, update end time
      if (field === 'start_datetime' && isBefore(prev.end_datetime, newDate)) {
        updated.end_datetime = addHours(newDate, 1);
      }
      
      return updated;
    });
  };

  // Handle participant selection changes
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Toggle participant selection
  const toggleParticipant = (employeeId) => {
    setFormValues(prev => {
      const participantId = employeeId.toString();
      const newParticipants = [...prev.participants];
      const index = newParticipants.indexOf(participantId);
      
      if (index === -1) {
        newParticipants.push(participantId);
      } else {
        newParticipants.splice(index, 1);
      }
      
      return { ...prev, participants: newParticipants };
    });
  };

  // Remove participant
  const removeParticipant = (employeeId, e) => {
    e.stopPropagation();
    setFormValues(prev => ({
      ...prev,
      participants: prev.participants.filter(id => id !== employeeId.toString())
    }));
  };

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      employee.first_name.toLowerCase().includes(searchLower) ||
      employee.last_name.toLowerCase().includes(searchLower) ||
      employee.email?.toLowerCase().includes(searchLower) ||
      employee.position?.toLowerCase().includes(searchLower)
    );
  });

  // Validate meeting form
  const validateMeetingForm = () => {
    const errors = {};
    
    // Required fields
    if (!formValues.title) errors.title = 'Title is required';
    if (!formValues.start_datetime) errors.start_datetime = 'Start date/time is required';
    if (!formValues.end_datetime) errors.end_datetime = 'End date/time is required';
    if (!formValues.location_or_link) errors.location_or_link = 'Location or meeting link is required';
    
    // Validate end date is after start date
    if (formValues.start_datetime && formValues.end_datetime) {
      if (new Date(formValues.start_datetime) >= new Date(formValues.end_datetime)) {
        errors.end_datetime = 'End time must be after start time';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle deleting a meeting
  const handleDeleteMeeting = async (meeting) => {
    // Only project managers can delete meetings
    if (!isProjectManager) {
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      try {
        await deleteMeeting(meeting.meeting_id);
        
        // Refresh meetings after delete
        await fetchMeetings(filter);
        
        // Close modal if open
        setMeetingModalVisible(false);
      } catch (error) {
        console.error('Error deleting meeting:', error);
        alert('Failed to delete meeting');
      }
    }
  };

  // Handle submitting the meeting form
  const handleSubmitMeeting = async () => {
    // Only project managers can create/edit meetings
    if (!isProjectManager) {
      return;
    }
    
    if (!validateMeetingForm()) {
      return;
    }
    
    try {
      setFormErrors({});
      setFormSuccess('');
      
      // Get current employee ID for the scheduled_by field
      const scheduledBy = user?.employee_id;
      if (!scheduledBy) {
        setFormErrors({ submit: 'User is not linked to an employee record' });
        return;
      }
      
      // Prepare meeting data with participants and properly formatted dates
      const meetingData = {
        title: formValues.title,
        description: formValues.description || '',
        scheduled_by: scheduledBy,
        start_datetime: toISOLocal(formValues.start_datetime),
        end_datetime: toISOLocal(formValues.end_datetime),
        location_or_link: formValues.location_or_link,
        participants: formValues.participants || []
      };
      
      console.log('Submitting meeting data:', meetingData);
      
      // Create or update meeting
      let response;
      if (isEditMode && selectedMeeting) {
        // For updates, include the meeting ID
        meetingData.meeting_id = selectedMeeting.meeting_id;
        response = await updateMeeting(selectedMeeting.meeting_id, meetingData);
        setFormSuccess('Meeting updated successfully');
      } else {
        // For new meetings
        response = await createMeeting(meetingData);
        setFormSuccess('Meeting scheduled successfully');
      }
      
      console.log('Meeting API response:', response);
      
      // Refresh meetings to show the updated data
      await fetchMeetings(filter);
      
      // Close modal after a delay
      setTimeout(() => {
        setMeetingModalVisible(false);
        setFormSuccess('');
      }, 1500);
    } catch (error) {
      console.error('Error saving meeting:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save meeting';
      setFormErrors({ 
        submit: errorMessage,
        ...(error.response?.data?.errors || {})
      });
    }
  };

  // Render the view-only meeting details modal
  const renderViewOnlyModal = () => {
    if (!selectedMeeting) return null;
    
    const startDate = toLocalDate(selectedMeeting.start_datetime);
    const endDate = toLocalDate(selectedMeeting.end_datetime);
    const isPast = new Date() > endDate;
    
    return (
      <CModal 
        visible={viewOnlyModalVisible} 
        onClose={() => setViewOnlyModalVisible(false)}
        size="lg"
      >
        <CModalHeader closeButton>
          <CModalTitle>{selectedMeeting.title}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-4">
            <div className="d-flex align-items-center mb-3">
              <CIcon icon={cilCalendar} className="me-2" />
              <div>
                <div className="fw-bold">
                  {formatDate(startDate, { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </div>
                <div>
                  {formatDate(startDate, { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })} - {formatDate(endDate, { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZoneName: 'short'
                  })}
                </div>
              </div>
            </div>
            
            {selectedMeeting.location_or_link && (
              <div className="d-flex align-items-center mb-3">
                <CIcon icon={cilPeople} className="me-2" />
                <div>
                  {selectedMeeting.location_or_link.startsWith('http') ? (
                    <a href={selectedMeeting.location_or_link} target="_blank" rel="noopener noreferrer">
                      {selectedMeeting.location_or_link}
                    </a>
                  ) : (
                    <span>{selectedMeeting.location_or_link}</span>
                  )}
                </div>
              </div>
            )}
            
            {selectedMeeting.description && (
              <div className="mb-3">
                <h6>Description</h6>
                <p className="text-muted">{selectedMeeting.description}</p>
              </div>
            )}
            
            {selectedMeeting.participants && selectedMeeting.participants.length > 0 && (
              <div className="mb-3">
                <h6>Participants</h6>
                <div className="d-flex flex-wrap gap-2">
                  {selectedMeeting.participants.map(participant => (
                    <CBadge color="light" className="text-dark p-2 d-flex align-items-center" key={participant.employee_id}>
                      <CAvatar size="sm" className="me-2" color="secondary">
                        {participant.employee_name?.charAt(0) || 'U'}
                      </CAvatar>
                      {participant.employee_name}
                    </CBadge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CModalBody>
        <CModalFooter>
          <Button 
            variant="contained"
            sx={{ backgroundColor: 'black', color: 'white', textTransform: 'none' }}
            onClick={() => setViewOnlyModalVisible(false)}
          >
            Close
          </Button>
          {isProjectManager && !isPast && (
            <Button 
              variant="contained"
              sx={{ backgroundColor: 'black', color: 'white', textTransform: 'none' }}
              onClick={handleEditMeeting}
            >
              Edit Meeting
            </Button>
          )}
        </CModalFooter>
      </CModal>
    );
  };

  // Meeting modal - for creating/editing meetings
  const renderMeetingModal = () => (
    <CModal
      visible={meetingModalVisible}
      onClose={() => setMeetingModalVisible(false)}
      size="lg"
    >
      <CModalHeader closeButton>
        <CModalTitle>
          {isEditMode ? 'Edit Meeting' : 'Schedule New Meeting'}
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {formSuccess && (
          <CAlert color="success" className="mb-3">
            {formSuccess}
          </CAlert>
        )}
        
        {formErrors.submit && (
          <CAlert color="danger" className="mb-3">
            {formErrors.submit}
          </CAlert>
        )}
        
        <CForm>
          <CRow className="mb-3">
            <CCol md={12}>
              <CFormInput
                type="text"
                id="title"
                name="title"
                label="Meeting Title *"
                placeholder="Enter meeting title"
                value={formValues.title}
                onChange={handleInputChange}
                invalid={!!formErrors.title}
                feedback={formErrors.title}
              />
            </CCol>
          </CRow>
          
          <CRow className="mb-3">
            <CCol md={6}>
              <div className="mb-3">
                <label className="form-label">Start Date & Time *</label>
                <DatePicker
                  selected={formValues.start_datetime}
                  onChange={date => handleDateTimeChange(date, 'start_datetime')}
                  showTimeSelect
                  timeFormat="h:mm aa"
                  timeIntervals={15}
                  timeCaption="Time"
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="form-control"
                  wrapperClassName="w-100"
                  selectsStart
                  startDate={formValues.start_datetime}
                  endDate={formValues.end_datetime}
                />
                {formErrors.start_datetime && (
                  <div className="invalid-feedback d-block">{formErrors.start_datetime}</div>
                )}
              </div>
            </CCol>
            
            <CCol md={6}>
              <div className="mb-3">
                <label className="form-label">End Date & Time *</label>
                <DatePicker
                  selected={formValues.end_datetime}
                  onChange={date => handleDateTimeChange(date, 'end_datetime')}
                  showTimeSelect
                  timeFormat="h:mm aa"
                  timeIntervals={15}
                  timeCaption="Time"
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="form-control"
                  wrapperClassName="w-100"
                  selectsEnd
                  startDate={formValues.start_datetime}
                  endDate={formValues.end_datetime}
                  minDate={formValues.start_datetime}
                />
                {formErrors.end_datetime && (
                  <div className="invalid-feedback d-block">{formErrors.end_datetime}</div>
                )}
              </div>
            </CCol>
          </CRow>
          
          <CRow className="mb-3">
            <CCol md={12}>
              <CFormInput
                type="text"
                id="location_or_link"
                name="location_or_link"
                label="Location or Meeting Link *"
                placeholder="Enter location or meeting URL"
                value={formValues.location_or_link}
                onChange={handleInputChange}
                invalid={!!formErrors.location_or_link}
                feedback={formErrors.location_or_link}
              />
            </CCol>
          </CRow>
          
          <CRow className="mb-3">
            <CCol md={12}>
              <label className="form-label">Participants</label>
              
              {/* Selected participants */}
              <div className="mb-2 d-flex flex-wrap gap-2">
                {formValues.participants.map(participantId => {
                  const employee = employees.find(e => e.employee_id.toString() === participantId);
                  if (!employee) return null;
                  
                  return (
                    <CBadge 
                      key={participantId}
                      color="primary"
                      className="d-flex align-items-center py-2 px-3"
                      style={{ cursor: 'default' }}
                    >
                      <CAvatar 
                        size="sm" 
                        color="light" 
                        textColor="primary" 
                        className="me-2"
                      >
                        {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                      </CAvatar>
                      {employee.first_name} {employee.last_name}
                      <Button 
                        type="button" 
                        className="btn-close btn-close-white ms-2" 
                        style={{ fontSize: '0.6rem' }}
                        onClick={(e) => removeParticipant(participantId, e)}
                        aria-label="Remove"
                      />
                    </CBadge>
                  );
                })}
              </div>
              
              {/* Search and select */}
              <div className="position-relative">
                <CInputGroup>
                  <CFormInput
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                  />
                  <CButton color="secondary" variant="outline">
                    <CIcon icon={cilSearch} />
                  </CButton>
                </CInputGroup>
                
                {/* Dropdown with search results */}
                {isDropdownOpen && filteredEmployees.length > 0 && (
                  <div 
                    className="border rounded mt-1 position-absolute w-100 bg-white"
                    style={{ 
                      maxHeight: '200px', 
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 6px 12px rgba(0,0,0,0.175)'
                    }}
                  >
                    {filteredEmployees.map(employee => (
                      <div 
                        key={employee.employee_id}
                        className={`p-2 d-flex align-items-center ${formValues.participants.includes(employee.employee_id.toString()) ? 'bg-light' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent input blur
                          toggleParticipant(employee.employee_id);
                        }}
                      >
                        <input 
                          type="checkbox" 
                          className="form-check-input me-2" 
                          checked={formValues.participants.includes(employee.employee_id.toString())}
                          onChange={() => {}}
                        />
                        <CAvatar 
                          size="sm" 
                          color="light" 
                          textColor="primary" 
                          className="me-2"
                        >
                          {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                        </CAvatar>
                        <div>
                          <div className="fw-semibold">
                            {employee.first_name} {employee.last_name}
                          </div>
                          <small className="text-muted">
                            {employee.position} • {employee.email}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <small className="text-muted">
                {formValues.participants.length} participant{formValues.participants.length !== 1 ? 's' : ''} selected
              </small>
            </CCol>
          </CRow>
          
          <CRow className="mb-3">
            <CCol md={12}>
              <CFormTextarea
                id="description"
                name="description"
                label="Description"
                placeholder="Enter meeting description"
                value={formValues.description}
                onChange={handleInputChange}
                rows={3}
                invalid={!!formErrors.description}
                feedback={formErrors.description}
              />
            </CCol>
          </CRow>
        </CForm>
        
        {isEditMode && isProjectManager && (
          <div className="mt-3 text-end">
            <CButton 
              color="danger" 
              variant="outline"
              onClick={() => handleDeleteMeeting(selectedMeeting)}
            >
              <CIcon icon={cilTrash} className="me-2" />
              Delete Meeting
            </CButton>
          </div>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={() => setMeetingModalVisible(false)}>
          Cancel
        </CButton>
        <CButton color="primary" onClick={handleSubmitMeeting} disabled={!!formSuccess}>
          {isEditMode ? 'Update Meeting' : 'Schedule Meeting'}
        </CButton>
      </CModalFooter>
    </CModal>
  );

  // Custom event styling for the calendar
  const eventStyleGetter = (event) => {
    let style = {
      backgroundColor: '#3c8dbc',
      borderRadius: '3px',
      color: 'white',
      border: 'none',
      display: 'block'
    };
    
    // Different color for meetings you're a participant in
    if (user?.employee_id && event.participants.some(
      p => p.employee_id.toString() === user.employee_id.toString()
    )) {
      style.backgroundColor = '#00a65a'; // Green for meetings you're in
    }
    
    return { style };
  };

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h4>Meetings Calendar</h4>
          <div>
            {isProjectManager && (
              <Button variant="contained" sx={{ backgroundColor: 'black', color: 'white', textTransform: 'none' }} onClick={handleAddMeetingClick}>
                <CIcon icon={cilPlus} className="me-2" />
                Add Meeting
              </Button>
            )}
          </div>
        </CCardHeader>
        <CCardBody>
          {/* Show filters only for managers and admins */}
          {isProjectManager && (
            <CRow className="mb-4">
              {/* <CCol md={3}>
                <CFormSelect
                  value={filter.project_id}
                  onChange={e => handleFilterChange('project_id', e.target.value)}
                  label="Filter by Project"
                >
                  <option value="">All Projects</option>
                  {projects.map(project => (
                    <option key={project.project_id} value={project.project_id}>
                      {project.name}
                    </option>
                  ))}
                </CFormSelect>
              </CCol> */}
              
              {/* <CCol md={3}>
                <CFormSelect
                  value={filter.team_id}
                  onChange={e => handleFilterChange('team_id', e.target.value)}
                  label="Filter by Team"
                >
                  <option value="">All Teams</option>
                  {teams.map(team => (
                    <option key={team.team_id} value={team.team_id}>
                      {team.name}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
               */}
              <CCol md={3}>
                <CFormSelect
                  value={filter.employee_id}
                  onChange={e => handleFilterChange('employee_id', e.target.value)}
                  label="Filter by Employee"
                >
                  <option value="">All Employees</option>
                  {employees.map(employee => (
                    <option key={employee.employee_id} value={employee.employee_id}>
                      {employee.first_name} {employee.last_name}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>
          )}
          
          {loading ? (
            <div className="d-flex justify-content-center my-5">
              <CSpinner color="primary" />
            </div>
          ) : (
            <div className="calendar-container" style={{ height: '700px' }}>
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={['month', 'week', 'day']}
                view={calendarView}
                onView={handleViewChange}
                date={calendarDate}
                onNavigate={handleNavigate}
                onRangeChange={handleRangeChange}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                selectable={isProjectManager}
                popup
                eventPropGetter={eventStyleGetter}
                tooltipAccessor={event => event.title}
                messages={{
                  today: 'Today',
                  previous: 'Back',
                  next: 'Next',
                  month: 'Month',
                  week: 'Week',
                  day: 'Day',
                  showMore: total => `+ ${total} more`
                }}
              />
            </div>
          )}

          {renderMeetingModal()}
          {renderViewOnlyModal()}
        </CCardBody>
      </CCard>
    </>
  );
};

export default Meetings;
