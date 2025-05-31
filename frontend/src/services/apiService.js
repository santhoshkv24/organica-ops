import axios from 'axios';

// Set base URL for API requests
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Important for cookies
});

// Add a request interceptor to include the token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Generic error handler (can be expanded)
const handleApiError = (error) => {
  console.error('API call failed:', error);
  // Handle specific error statuses (e.g., 401 Unauthorized, 403 Forbidden)
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Error data:', error.response.data);
    console.error('Error status:', error.response.status);
    // Maybe trigger logout on 401
    if (error.response.status === 401 && !error.config.url.includes('/auth/login')) {
        // Avoid logout loop if login itself fails
        // Consider triggering logout action from AuthContext here
        // Example: authContext.logout();
        alert('Session expired. Please log in again.');
        window.location.href = '/#/login'; // Force redirect to login
    }
    return Promise.reject(error.response.data.message || 'An API error occurred');
  } else if (error.request) {
    // The request was made but no response was received
    console.error('Error request:', error.request);
    return Promise.reject('No response from server. Check network connection.');
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Error message:', error.message);
    return Promise.reject(error.message);
  }
};

// --- Company API Calls ---
export const getCompanies = () => apiClient.get('/companies').catch(handleApiError);
export const getCompanyById = (id) => apiClient.get(`/companies/${id}`).catch(handleApiError);
export const createCompany = (companyData) => apiClient.post('/companies', companyData).catch(handleApiError);
export const updateCompany = (id, companyData) => apiClient.put(`/companies/${id}`, companyData).catch(handleApiError);
export const deleteCompany = (id) => apiClient.delete(`/companies/${id}`).catch(handleApiError);

// --- Department API Calls ---
export const getDepartments = () => apiClient.get('/departments').catch(handleApiError);
export const getDepartmentById = (id) => apiClient.get(`/departments/${id}`).catch(handleApiError);
export const createDepartment = (departmentData) => apiClient.post('/departments', departmentData).catch(handleApiError);
export const updateDepartment = (id, departmentData) => apiClient.put(`/departments/${id}`, departmentData).catch(handleApiError);
export const deleteDepartment = (id) => apiClient.delete(`/departments/${id}`).catch(handleApiError);

// --- Team API Calls ---
export const getTeams = () => apiClient.get('/teams').catch(handleApiError);
export const getTeamById = (id) => apiClient.get(`/teams/${id}`).catch(handleApiError);
export const createTeam = (teamData) => apiClient.post('/teams', teamData).catch(handleApiError);
export const updateTeam = (id, teamData) => apiClient.put(`/teams/${id}`, teamData).catch(handleApiError);
export const deleteTeam = (id) => apiClient.delete(`/teams/${id}`).catch(handleApiError);

// --- Employee API Calls ---
export const getEmployees = () => apiClient.get('/employees').catch(handleApiError);
export const getEmployeeById = (id) => apiClient.get(`/employees/${id}`).catch(handleApiError);
export const createEmployee = (employeeData) => apiClient.post('/employees', employeeData).catch(handleApiError);
export const updateEmployee = (id, employeeData) => apiClient.put(`/employees/${id}`, employeeData).catch(handleApiError);
export const deleteEmployee = (id) => apiClient.delete(`/employees/${id}`).catch(handleApiError);

// --- Customer Company API Calls ---
export const getCustomerCompanies = () => apiClient.get('/customer-companies').catch(handleApiError);
export const getCustomerCompanyById = (id) => apiClient.get(`/customer-companies/${id}`).catch(handleApiError);
export const createCustomerCompany = (customerCompanyData) => apiClient.post('/customer-companies', customerCompanyData).catch(handleApiError);
export const updateCustomerCompany = (id, customerCompanyData) => apiClient.put(`/customer-companies/${id}`, customerCompanyData).catch(handleApiError);
export const deleteCustomerCompany = (id) => apiClient.delete(`/customer-companies/${id}`).catch(handleApiError);

// --- Customer Details API Calls ---
export const getCustomerDetails = () => apiClient.get('/customer-details').catch(handleApiError);
export const getCustomerDetailById = (id) => apiClient.get(`/customer-details/${id}`).catch(handleApiError);
export const createCustomerDetail = (customerDetailData) => apiClient.post('/customer-details', customerDetailData).catch(handleApiError);
export const updateCustomerDetail = (id, customerDetailData) => apiClient.put(`/customer-details/${id}`, customerDetailData).catch(handleApiError);
export const deleteCustomerDetail = (id) => apiClient.delete(`/customer-details/${id}`).catch(handleApiError);

// --- Auth API Calls (already handled in AuthContext, but could be here too) ---
// export const loginUser = (credentials) => apiClient.post('/auth/login', credentials).catch(handleApiError);
// export const registerUser = (userData) => apiClient.post('/auth/register', userData).catch(handleApiError);
// export const getProfile = () => apiClient.get('/auth/me').catch(handleApiError);

export default apiClient;

