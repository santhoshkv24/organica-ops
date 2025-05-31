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
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Auth API calls
export const loginUser = (credentials) => handleResponse(() => api.post('/auth/login', credentials));
export const registerUser = (userData) => handleResponse(() => api.post('/auth/register', userData));
export const logoutUser = () => handleResponse(() => api.post('/auth/logout'));
export const getProfile = () => handleResponse(() => api.get('/auth/me'));

// Company API calls
export const getCompanies = () => handleResponse(() => api.get('/companies'));
export const getCompanyById = (id) => handleResponse(() => api.get(`/companies/${id}`));
export const createCompany = (data) => handleResponse(() => api.post('/companies', data));
export const updateCompany = (id, data) => handleResponse(() => api.put(`/companies/${id}`, data));
export const deleteCompany = (id) => handleResponse(() => api.delete(`/companies/${id}`));

// Department API calls
export const getDepartments = () => handleResponse(() => api.get('/departments'));
export const getDepartmentById = (id) => handleResponse(() => api.get(`/departments/${id}`));
export const createDepartment = (data) => handleResponse(() => api.post('/departments', data));
export const updateDepartment = (id, data) => handleResponse(() => api.put(`/departments/${id}`, data));
export const deleteDepartment = (id) => handleResponse(() => api.delete(`/departments/${id}`));

// Team API calls
export const getTeams = () => handleResponse(() => api.get('/teams'));
export const getTeamById = (id) => handleResponse(() => api.get(`/teams/${id}`));
export const createTeam = (data) => handleResponse(() => api.post('/teams', data));
export const updateTeam = (id, data) => handleResponse(() => api.put(`/teams/${id}`, data));
export const deleteTeam = (id) => handleResponse(() => api.delete(`/teams/${id}`));

// Employee API calls
export const getEmployees = () => handleResponse(() => api.get('/employees'));
export const getEmployeeById = (id) => handleResponse(() => api.get(`/employees/${id}`));
export const createEmployee = (data) => handleResponse(() => api.post('/employees', data));
export const updateEmployee = (id, data) => handleResponse(() => api.put(`/employees/${id}`, data));
export const deleteEmployee = (id) => handleResponse(() => api.delete(`/employees/${id}`));

// Customer Company API calls
export const getCustomerCompanies = () => handleResponse(() => api.get('/customer-companies'));
export const getCustomerCompanyById = (id) => handleResponse(() => api.get(`/customer-companies/${id}`));
export const createCustomerCompany = (data) => handleResponse(() => api.post('/customer-companies', data));
export const updateCustomerCompany = (id, data) => handleResponse(() => api.put(`/customer-companies/${id}`, data));
export const deleteCustomerCompany = (id) => handleResponse(() => api.delete(`/customer-companies/${id}`));

// Customer Details API calls
export const getCustomerDetails = () => handleResponse(() => api.get('/customer-details'));
export const getCustomerDetailById = (id) => handleResponse(() => api.get(`/customer-details/${id}`));
export const createCustomerDetail = (data) => handleResponse(() => api.post('/customer-details', data));
export const updateCustomerDetail = (id, data) => handleResponse(() => api.put(`/customer-details/${id}`, data));
export const deleteCustomerDetail = (id) => handleResponse(() => api.delete(`/customer-details/${id}`));

export default api; 