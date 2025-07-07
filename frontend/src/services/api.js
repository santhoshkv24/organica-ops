import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    // Ensure consistent response format
    if (!response.data.hasOwnProperty('success')) {
      response.data = {
        success: true,
        data: response.data
      };
    }
    return response;
  },
  async (error) => {
    if (error.response) {
      // Handle specific error cases
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('authToken');
          window.location.href = '/#/login';
          break;
        case 403:
          console.error('Access forbidden:', error.response.data);
          break;
        case 404:
          console.error('Resource not found:', error.response.data);
          break;
        case 422:
          console.error('Validation error:', error.response.data);
          break;
        default:
          console.error('API error:', error.response.data);
      }

      // Format error response
      const errorResponse = {
        success: false,
        message: error.response.data.message || 'An error occurred',
        error: error.response.data.error,
        status: error.response.status
      };

      return Promise.reject(errorResponse);
    }

    // Handle network errors
    if (error.request) {
      console.error('Network error:', error.request);
      return Promise.reject({
        success: false,
        message: 'Network error. Please check your connection.',
        error: 'NETWORK_ERROR'
      });
    }

    // Handle other errors
    console.error('Error:', error.message);
    return Promise.reject({
      success: false,
      message: 'An unexpected error occurred',
      error: error.message
    });
  }
);

// Helper function to handle API responses
const handleResponse = async (apiCall) => {
  try {
    const response = await apiCall();
    
    // Log response only in development environment to avoid excessive logging
    if (process.env.NODE_ENV === 'development') {
    console.log('API response:', response.data);
    }
    
    // Handle different response formats - ensure consistent structure
    if (response.data && typeof response.data === 'object') {
      // Normalize empty arrays to be consistent
      if (Array.isArray(response.data.data) && response.data.data.length === 0) {
        return response.data; // Return normalized empty array response
      }
      
      // If response already has the expected format, return it directly
    return response.data;
    }
    
    // Otherwise wrap it in a standard format
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
};

// Helper function to create form data with Turnstile token
const createFormDataWithTurnstile = (data) => {
  // Extract the Turnstile token from the data
  const { 'cf-turnstile-response': cfTurnstileResponse, ...restData } = data;
  
  // Create form data
  const formData = new FormData();
  
  // Append all form fields
  Object.entries(restData).forEach(([key, value]) => {
    // Handle nested objects and arrays
    if (value !== null && typeof value === 'object' && !(value instanceof File)) {
      formData.append(key, JSON.stringify(value));
    } else if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  
  // Add the Turnstile token if it exists
  if (cfTurnstileResponse) {
    formData.append('cf-turnstile-response', cfTurnstileResponse);
  }
  
  return formData;
};

// Auth API calls
export const loginUser = (credentials) => {
  return handleResponse(async () => {
    console.log('Login credentials:', credentials);
    
    // Create a plain JSON object for login instead of FormData
    const loginData = {
      email: credentials.email,
      password: credentials.password,
      'cf-turnstile-response': credentials['cf-turnstile-response']
    };
    
    console.log('Sending login data:', loginData);
    
    const response = await api.post('/auth/login', loginData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      // Add timeout to prevent hanging requests
      timeout: 30000 // 30 seconds
    });
    
    return response;
  });
};

export const registerUser = (userData) => {
  return handleResponse(async () => {
    const formData = createFormDataWithTurnstile(userData);
    
    const response = await api.post('/auth/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      },
      // Add timeout to prevent hanging requests
      timeout: 30000 // 30 seconds
    });
    
    return response;
  });
};

export const logoutUser = () => handleResponse(() => api.post('/auth/logout'));
export const setFirstTimePassword = (newPassword) => handleResponse(() => api.put('/auth/set-first-password', { newPassword }));
export const forgotPassword = (email) => handleResponse(() => api.post('/auth/forgot-password', { email }));
export const verifyResetCode = (email, code) => handleResponse(() => api.post('/auth/verify-reset-code', { email, code }));
export const resetPassword = (token, password) => handleResponse(() => api.post('/auth/reset-password', { token, password }));

// Get current user profile
export const getProfile = async () => {
  try {
    const response = await api.get('/auth/me');
    console.log('Profile API response:', response);
    return response.data;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

// Branch API calls (previously Company)
export const getCompanies = () => handleResponse(() => api.get('/branches'));
export const getCompanyById = (id) => handleResponse(() => api.get(`/branches/${id}`));
export const createCompany = (data) => handleResponse(() => api.post('/branches', data));
export const updateCompany = (id, data) => handleResponse(() => api.put(`/branches/${id}`, data));
export const deleteCompany = (id) => handleResponse(() => api.delete(`/branches/${id}`));

// Team API calls
export const getTeams = () => handleResponse(() => api.get('/teams'));
export const getTeamById = (id) => handleResponse(() => api.get(`/teams/${id}`));
export const createTeam = (data) => handleResponse(() => api.post('/teams', data));
export const updateTeam = (id, data) => handleResponse(() => api.put(`/teams/${id}`, data));
export const deleteTeam = (id) => handleResponse(() => api.delete(`/teams/${id}`));

// Team Lead Management

/**
 * Get team leads for a specific team
 * @param {number} teamId - The ID of the team
 * @returns {Promise<Array>} Array of team leads
 */
export const getTeamLeads = (teamId) => 
  handleResponse(() => api.get(`/teams/${teamId}/leads`));

/**
 * Assign a team lead to a team
 * @param {number} teamId - The ID of the team
 * @param {number} employeeId - The ID of the employee to assign as team lead
 * @returns {Promise<Object>} Updated team with team leads
 */
export const assignTeamLead = (teamId, employeeId) => 
  handleResponse(() => api.post(`/teams/${teamId}/leads`, { employee_id: employeeId }));

/**
 * Remove a team lead
 * @param {number} teamLeadId - The ID of the team lead assignment to remove
 * @returns {Promise<Object>} Empty object on success
 */
export const removeTeamLead = (teamLeadId) => 
  handleResponse(() => api.delete(`/teams/leads/${teamLeadId}`));

/**
 * Get teams where the current user is a team lead
 * @returns {Promise<Array>} Array of teams where the user is a team lead
 */
export const getMyTeamLeads = () => 
  handleResponse(() => api.get('/teams/my/leads'));

/**
 * Get members of a team
 * @param {number} teamId - The ID of the team
 * @returns {Promise<Array>} Array of team members
 */
export const getTeamMembers = (teamId) => 
  handleResponse(() => api.get(`/teams/${teamId}/members`));

/**
 * Get team lead status for a specific employee
 * @param {number} employeeId - The ID of the employee
 * @returns {Promise<Object>} Object containing team lead status and team assignments
 */
export const getTeamLeadStatus = (employeeId) => 
  handleResponse(() => api.get(`/teams/employee/${employeeId}/lead-status`));
export const getTeamsByBranch = (branchId) => {
  console.log(`Calling getTeamsByBranch API with branchId: ${branchId}`);
  return handleResponse(() => api.get(`/teams/branch/${branchId}`))
    .then(response => {
      console.log('Teams by branch response:', response);
      return response;
    })
    .catch(error => {
      console.error('Teams by branch error:', error);
      throw error;
    });
};

export const getMeetings = () => handleResponse(() => api.get('/meetings'));
export const getMeetingById = (id) => handleResponse(() => api.get(`/meetings/${id}`));
export const createMeeting = (data) => handleResponse(() => api.post('/meetings', data));
export const updateMeeting = (id, data) => handleResponse(() => api.put(`/meetings/${id}`, data));
export const deleteMeeting = (id) => handleResponse(() => api.delete(`/meetings/${id}`));
export const getMeetingsByTeam = (teamId) => handleResponse(() => api.get(`/meetings/team/${teamId}`));
export const getMeetingsByProject = (projectId) => handleResponse(() => api.get(`/meetings/project/${projectId}`));
export const getMeetingsByDateRange = (start_date, end_date) => handleResponse(() => api.get(`/meetings/date-range`, { params: { start_date, end_date } }));
export const getEmployeeMeetings = (employeeId) => handleResponse(() => api.get(employeeId ? `/meetings/employee/${employeeId}` : '/meetings/employee'));
export const addMeetingParticipant = (meeting_id, employee_id) => handleResponse(() => api.post('/meetings/participants', { meeting_id, employee_id }));
export const removeMeetingParticipant = (meeting_id, employee_id) => handleResponse(() => api.delete('/meetings/participants', { data: { meeting_id, employee_id } }));
export const getMeetingParticipants = (meetingId) => handleResponse(() => api.get(`/meetings/${meetingId}/participants`));


// Employee API calls
export const getEmployees = () => handleResponse(() => api.get('/employees'));
export const getEmployeeById = (id) => handleResponse(() => api.get(`/employees/${id}`));
export const createEmployee = (data) => handleResponse(() => api.post('/employees', data));
export const updateEmployee = (id, data) => handleResponse(() => api.put(`/employees/${id}`, data));
export const deleteEmployee = (id) => handleResponse(() => api.delete(`/employees/${id}`));
export const getEmployeesByTeam = (teamId) => handleResponse(() => api.get(`/employees/team/${teamId}`));
export const getEmployeesByBranch = (branchId) => handleResponse(() => api.get(`/employees/branch/${branchId}`));

export const importEmployees = (formData) => {
  return api.post('/employees/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Project API calls
export const getProjects = () => handleResponse(() => api.get('/projects'));
export const getProject = () => handleResponse(() => api.get('/projects'));
export const getProjectById = (id) => handleResponse(() => api.get(`/projects/${id}`));
export const createProject = (data) => handleResponse(() => api.post('/projects', data));
export const updateProject = (id, data) => handleResponse(() => api.put(`/projects/${id}`, data));
export const deleteProject = (id) => handleResponse(() => api.delete(`/projects/${id}`));
export const getProjectsByTeam = (teamId) => handleResponse(() => api.get(`/projects/team/${teamId}`));
export const getProjectsByManager = (managerId) => handleResponse(() => api.get(`/projects/manager/${managerId}`));

// Project-Team Relationship API calls
export const getProjectTeams = (projectId) => handleResponse(() => api.get(`/projects/${projectId}/teams`));
export const addProjectTeam = (projectId, teamId) => handleResponse(() => api.post(`/projects/${projectId}/teams`, { team_id: teamId }));
export const removeProjectTeam = (projectId, teamId) => handleResponse(() => api.delete(`/projects/${projectId}/teams/${teamId}`));
export const updateProjectTeams = (projectId, teamIds) => handleResponse(() => api.put(`/projects/${projectId}/teams`, { team_ids: teamIds }));

// Project Team Members Management
export const getProjectTeamMembers = (projectId) => handleResponse(() => api.get(`/project-team-members/project/${projectId}`));
export const addProjectTeamMember = (data) => handleResponse(() => api.post('/project-team-members', data));
export const removeProjectTeamMember = (id) => handleResponse(() => api.delete(`/project-team-members/${id}`));
export const getProjectTeamMembersByEmployee = (employeeId) => handleResponse(() => api.get(`/project-team-members/employee/${employeeId}`));
export const getMyProjectTeams = () => handleResponse(() => api.get('/project-team-members/my-projects'));

// ============================================
// Customer Management API
// ============================================

// Customer Companies
export const getCustomerCompanies = () =>
  handleResponse(() => api.get('/customer-companies'));

export const getCustomerCompanyById = (id) =>
  handleResponse(() => api.get(`/customer-companies/${id}`));

export const createCustomerCompany = (data) =>
  handleResponse(() => api.post('/customer-companies', data));

export const updateCustomerCompany = (id, data) =>
  handleResponse(() => api.put(`/customer-companies/${id}`, data));

export const deleteCustomerCompany = (id) =>
  handleResponse(() => api.delete(`/customer-companies/${id}`));

// Customer Employees
export const getCustomerEmployees = (companyId) =>
  handleResponse(() => api.get(companyId ? `/customer-employees/company/${companyId}` : '/customer-employees'));

export const getCustomerEmployeeById = (id) =>
  handleResponse(() => api.get(`/customer-employees/${id}`));

export const createCustomerEmployee = (data) =>
  handleResponse(() => api.post('/customer-employees', data));

export const updateCustomerEmployee = (id, data) =>
  handleResponse(() => api.put(`/customer-employees/${id}`, data));

export const deleteCustomerEmployee = (id) =>
  handleResponse(() => api.delete(`/customer-employees/${id}`));

export const getCustomerHeadsByCompany = (companyId) =>
  handleResponse(() => api.get(`/customer-employees/company/${companyId}/heads`));

export const searchCustomerEmployees = (companyId, searchTerm) =>
  handleResponse(() => api.get(`/customer-employees/search?companyId=${companyId}&search=${encodeURIComponent(searchTerm)}`));

// Customer Team Members
export const getCustomerTeamMembers = (projectId) =>
  handleResponse(() => api.get(projectId ? `/customer-teams?projectId=${projectId}` : '/customer-teams'));

export const getCustomerTeamMemberById = (id) =>
  handleResponse(() => api.get(`/customer-teams/${id}`));

export const addCustomerTeamMember = (data) =>
  handleResponse(() => api.post('/customer-teams', data));

export const updateCustomerTeamMember = (id, data) =>
  handleResponse(() => api.put(`/customer-teams/${id}`, data));

export const removeCustomerTeamMember = (id) =>
  handleResponse(() => api.delete(`/customer-teams/${id}`));

export const getCustomerTeamMembersByProject = (projectId) =>
  handleResponse(() => api.get(`/customer-teams/project/${projectId}`));

export const getCustomerTeamMembersByCustomer = (customerId) =>
  handleResponse(() => api.get(`/customer-teams/customer/${customerId}`));

export const assignCustomerToProject = (projectId, customerId, employeeId) =>
  handleResponse(() => api.post('/customer-teams/assign', { projectId, customerId, employeeId }));

export const unassignCustomerFromProject = (projectId, customerId, employeeId) =>
  handleResponse(() => api.post('/customer-teams/unassign', { projectId, customerId, employeeId }));

// Customer Team Heads
export const getCustomerTeamHead = (projectId) =>
  handleResponse(() => api.get(`/customer-teams/project/${projectId}/heads`));

export const getCustomerHeadsByProject = (projectId) =>
  handleResponse(() => api.get(`/customer-teams/project/${projectId}/heads`));

export const getCustomerEmployeesByProject = (projectId) =>
  handleResponse(() => api.get(`/customer-teams/project/${projectId}/employees`));

export const getMyCustomerTeams = () =>
  handleResponse(() => api.get('/customer-teams'));

// Note: The following endpoints might need to be implemented in the backend
// if they are required by the frontend
export const assignCustomerTeamHead = (projectId, customerId) =>
  handleResponse(() => api.post('/customer-teams/assign-head', { projectId, customerId }));

export const removeCustomerTeamHead = (projectId) =>
  handleResponse(() => api.delete(`/customer-teams/project/${projectId}/head`));

// Customer Details
export const getCustomerDetails = () =>
  handleResponse(() => api.get('/customer-details'));

export const getCustomerDetailById = (id) =>
  handleResponse(() => api.get(`/customer-details/${id}`));

export const createCustomerDetail = (data) =>
  handleResponse(() => api.post('/customer-details', data));

export const updateCustomerDetail = (id, data) =>
  handleResponse(() => api.put(`/customer-details/${id}`, data));

export const deleteCustomerDetail = (id) =>
  handleResponse(() => api.delete(`/customer-details/${id}`));

// Enhanced Track Entry API calls
export const getTrackEntries = (params = {}) => handleResponse(() => api.get('/track-entries', { params }));
export const getTrackEntry = (id) => handleResponse(() => api.get(`/track-entries/${id}`));
export const createTrackEntry = (data) => handleResponse(() => api.post('/track-entries', data));
export const updateTrackEntry = (id, data) => handleResponse(() => api.put(`/track-entries/${id}`, data));
export const deleteTrackEntry = (id) => handleResponse(() => api.delete(`/track-entries/${id}`));
export const updateTrackEntryStatus = (id, status) => handleResponse(() => api.put(`/track-entries/${id}/status`, { status }));
export const logHoursWorked = (id, hours) => handleResponse(() => api.post(`/track-entries/${id}/log-hours`, { hours }));
export const getAssignableEmployees = (params = {}) => {
  console.log('Calling getAssignableEmployees with params:', params);
  return handleResponse(() => api.get('/track-entries/assignable-employees', { params }))
    .then(response => {
      console.log('getAssignableEmployees response:', response);
      return response;
    })
    .catch(error => {
      console.error('getAssignableEmployees error:', error);
      throw error;
    });
};
export const getTrackEntryDashboard = () => handleResponse(() => api.get('/track-entries/dashboard/summary'));
export const getCustomerTrackEntryDashboard = () => handleResponse(() => api.get('/customer-track-entries/dashboard/summary'));
export const getCustomerCompanyTasks = () => handleResponse(() => api.get('/customer-track-entries/company-tasks'));
export const getTrackEntryStatistics = () => handleResponse(() => api.get('/track-entries/statistics'));
export const getTrackEntriesByProject = (projectId, params = {}) => handleResponse(() => api.get(`/track-entries/project/${projectId}`, { params }));
export const getTrackEntriesByTeam = (teamId, params = {}) => handleResponse(() => api.get(`/track-entries/team/${teamId}`, { params }));
export const getTrackEntriesByEmployee = (employeeId, params = {}) => handleResponse(() => api.get(`/track-entries/employee/${employeeId}`, { params }));
export const getProjectManagerTasks = (managerId) => {
  if (!managerId) {
    console.warn('getProjectManagerTasks called with undefined managerId');
    return Promise.resolve({ success: true, data: [] });
  }
  return handleResponse(() => {
    console.log(`Calling API: /track-entries/project-manager/${managerId}`);
    return api.get(`/track-entries/project-manager/${managerId}`);
  }).then(response => {
    console.log('getProjectManagerTasks response:', response);
    return response;
  }).catch(error => {
    console.error('Error in getProjectManagerTasks:', error);
    throw error;
  });
};
export const getTeamLeadTasks = (teamLeadId) => {
  if (!teamLeadId) {
    console.warn('getTeamLeadTasks called with undefined teamLeadId');
    return Promise.resolve({ success: true, data: [] });
  }
  return handleResponse(() => {
    console.log(`Calling API: /track-entries/team-lead/${teamLeadId}`);
    return api.get(`/track-entries/team-lead/${teamLeadId}`);
  }).then(response => {
    console.log('getTeamLeadTasks response:', response);
    return response;
  }).catch(error => {
    console.error('Error in getTeamLeadTasks:', error);
    throw error;
  });
};
export const getTrackEntriesByAssignedBy = (assignedById, params = {}) => {
  // Don't make the API call if assignedById is undefined
  if (!assignedById) {
    console.warn('getTrackEntriesByAssignedBy called with undefined assignedById');
    return Promise.resolve({ success: true, data: [] });
  }
  return handleResponse(() => {
    console.log(`Calling API: /track-entries/assigned-by/${assignedById}`);
    return api.get(`/track-entries/assigned-by/${assignedById}`, { params });
  }).then(response => {
    console.log('getTrackEntriesByAssignedBy response:', response);
    return response;
  }).catch(error => {
    console.error('Error in getTrackEntriesByAssignedBy:', error);
    throw error;
  });
};

// New Track Entry API calls for the enhanced workflow
export const getAssignableCustomers = (params = {}) => handleResponse(() => api.get('/track-entries/assignable-customers', { params }));
export const getTrackEntriesByCustomer = (customerId, params = {}) => handleResponse(() => api.get(`/track-entries/customer/${customerId}`, { params }));
export const getTrackEntriesByCustomerTeam = (projectId, params = {}) => handleResponse(() => api.get(`/track-entries/customer-team/${projectId}`, { params }));
export const getTrackEntryHistory = (trackEntryId) => handleResponse(() => api.get(`/track-entries/${trackEntryId}/history`));
export const getMyAssignedTasks = (params = {}) => handleResponse(() => api.get('/track-entries/my-assigned', { params }));
export const getMyCreatedTasks = (params = {}) => handleResponse(() => api.get('/track-entries/my-created', { params }));

// Customer Track Entry API calls
export const getCustomerTrackEntries = (params = {}) => handleResponse(() => api.get('/customer-track-entries', { params }));
export const getCustomerTrackEntry = (id) => handleResponse(() => api.get(`/customer-track-entries/${id}`));
export const createCustomerTrackEntry = (data) => handleResponse(() => api.post('/customer-track-entries', data));
export const updateCustomerTrackEntry = (id, data) => handleResponse(() => api.put(`/customer-track-entries/${id}`, data));
export const deleteCustomerTrackEntry = (id) => handleResponse(() => api.delete(`/customer-track-entries/${id}`));
export const updateCustomerTrackEntryStatus = (id, status) => handleResponse(() => api.put(`/customer-track-entries/${id}/status`, { status }));
export const getCustomerTrackEntriesByAssignedBy = (assignedById, params = {}) => {
  // Don't make the API call if assignedById is undefined
  if (!assignedById) {
    console.warn('getCustomerTrackEntriesByAssignedBy called with undefined assignedById');
    return Promise.resolve({ success: true, data: [] });
  }
  return handleResponse(() => {
    console.log(`Calling API: /customer-track-entries/assigned-by/${assignedById}`);
    return api.get(`/customer-track-entries/assigned-by/${assignedById}`, { params });
  }).then(response => {
    console.log('getCustomerTrackEntriesByAssignedBy response:', response);
    return response;
  }).catch(error => {
    console.error('Error in getCustomerTrackEntriesByAssignedBy:', error);
    throw error;
  });
};

// Get project by customer head ID
export const getProjectByCustomerHeadId = (customerHeadId) => {
  return handleResponse(() => api.get(`/customer-teams/customer-head/${customerHeadId}/project`));
};

// Customer Team Member API calls (continued)
// Note: Removed duplicate function declarations that were causing build errors
// These functions are already defined earlier in the file with the same or similar implementation

// User Management API calls
export const getUsers = () => handleResponse(() => api.get('/users'));
export const getUserById = (id) => handleResponse(() => api.get(`/users/${id}`));
export const createUser = (data) => handleResponse(() => api.post('/users', data));
export const updateUser = (id, data) => handleResponse(() => api.put(`/users/${id}`, data));
export const deleteUser = (id) => handleResponse(() => api.delete(`/users/${id}`));
export const uploadProfilePicture = (formData) => handleResponse(() => 
  api.post('/users/profile-picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
);

// Project Assignment API calls
export const getProjectAssignments = (projectId) => 
  api.get(`/project-assignments/project/${projectId}`);

export const getEmployeeAssignments = (employeeId) => 
  api.get(`/project-assignments/employee/${employeeId}`);

export const createProjectAssignment = (data) => 
  api.post('/project-assignments', data);

export const updateProjectAssignment = (id, data) => 
  api.put(`/project-assignments/${id}`, data);

export const deleteProjectAssignment = (id) => 
  api.delete(`/project-assignments/${id}`);

export default api; 