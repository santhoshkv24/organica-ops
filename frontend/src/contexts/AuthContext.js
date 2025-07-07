import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser, registerUser, logoutUser, getProfile } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile with token:', token ? 'token exists' : 'no token');
      const response = await getProfile();
      console.log('Profile response:', response);
      
      // Check if we got a valid response with user data
      if (response && response.success && response.data) {
        setUser(response.data);
        console.log('User profile set:', response.data);
      } else {
        console.error('Invalid profile response format:', response);
        handleLogout();
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (credentials) => {
    try {
      const response = await loginUser(credentials);
      console.log('Raw login response:', response);
      
      // Check if response and response.data exist
      if (!response || !response.success) {
        throw new Error(response?.message || 'Login request failed');
      }
      
      // Extract token and user data - fixing the data structure
      const token = response.token;
      const userData = response.data;
      
      console.log('Extracted auth data:', { 
        token: token ? 'token_exists' : 'no_token', 
        userData 
      });
      
      if (!token) {
        throw new Error('No authentication token received');
      }
      
      localStorage.setItem('authToken', token);
      setToken(token);
      setUser(userData);
      
      // Check if this is a first-time login
      if (userData.isFirstLogin) {
        setIsFirstLogin(true);
      }
      
      return { 
        success: true,
        isFirstLogin: userData.isFirstLogin 
      };
    } catch (error) {
      console.error('Login failed:', error);
      // Create a user-friendly error message
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.message) {
        if (error.message.includes('email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('username')) {
          errorMessage = 'Please enter a valid username.';
        } else if (error.message.includes('password')) {
          errorMessage = 'Please enter a valid password.';
        } else if (error.message.includes('credentials')) {
          errorMessage = 'Invalid credentials. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { success: false, message: errorMessage, error: error.error, status: error.status };
    }
  };

  const handleRegister = async (userData) => {
    try {
      const response = await registerUser(userData);
      const message = response.data.message || 'Registration successful! Please login.';
      return { success: true, message };
    } catch (error) {
      console.error('Registration failed:', error);
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, message };
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
      setIsFirstLogin(false);
    }
  };

  // Role-based permission helpers
  const isAdmin = user?.role === 'admin';
  const isProjectManager = user?.role === 'manager';
  const isTeamLead = user?.role === 'team_lead';
  const isCustomerTeamsHead = user?.role === 'customer_head';
  const isCustomerTeamMember = user?.role === 'customer_employee';
  const isRegularEmployee = user?.role === 'employee';

  // Permission-based access control helpers
  const canManageProjects = isAdmin || isProjectManager;
  const canManageTeams = isAdmin || isProjectManager || isTeamLead;
  const canManageCustomerTeam = isAdmin || isProjectManager || isCustomerTeamsHead;
  const canAssignTasks = isAdmin || isProjectManager || isTeamLead || isCustomerTeamsHead;
  
  // Task assignment scope helpers
  const canAssignToAnyoneInProject = isAdmin || isProjectManager;
  const canAssignToTeamMembers = isTeamLead;
  const canAssignToCustomerTeamMembers = isCustomerTeamsHead;
  const canOnlyViewOwnTasks = isRegularEmployee || isCustomerTeamMember;

  const value = {
    user,
    token,
    loading,
    isFirstLogin,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    isAuthenticated: !!token && !!user && !loading,
    
    // Role checks
    isAdmin,
    isProjectManager,
    isTeamLead,
    isCustomerTeamsHead,
    isCustomerTeamMember,
    isRegularEmployee,
    
    // Permission checks
    canManageProjects,
    canManageTeams,
    canManageCustomerTeam,
    canAssignTasks,
    
    // Assignment scope checks
    canAssignToAnyoneInProject,
    canAssignToTeamMembers,
    canAssignToCustomerTeamMembers,
    canOnlyViewOwnTasks,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

