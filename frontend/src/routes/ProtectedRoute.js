import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // Optional: Show a loading spinner while checking auth status
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" replace />;
  }

  return children || <Outlet />; // Render children or Outlet for nested routes
};

// Optional: Specific route for Admin users
export const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, isAdmin, isProjectManager } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin && !isProjectManager) {
    // Redirect non-admin users (e.g., to dashboard or a 'not authorized' page)
    // For simplicity, redirecting to dashboard here.
    // Consider creating a dedicated 'Unauthorized' page.
    return <Navigate to="/dashboard" replace />;
  }

  return children || <Outlet />; // Render children or Outlet for nested routes
};

export const ProjectManagerRoute = ({ children }) => {
  const { isAuthenticated, loading, isAdmin, isProjectManager } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin && !isProjectManager) {
    return <Navigate to="/dashboard" replace state={{ error: 'Access denied. Project manager or admin access required.' }} />;
  }

  return children || <Outlet />;
};

export const EmployeeRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Allow any authenticated user - all roles should be able to access employee features
  return children || <Outlet />;
};

export const TeamLeadRoute = ({ children }) => {
  const { isAuthenticated, loading, isAdmin, isProjectManager, isTeamLead } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin && !isProjectManager && !isTeamLead) {
    return <Navigate to="/dashboard" replace />;
  }

  return children || <Outlet />;
};

export const ManagerOrTeamLeadRoute = ({ children }) => {
  const { isAuthenticated, loading, isProjectManager, isTeamLead, isCustomerTeamsHead } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isProjectManager && !isTeamLead && !isCustomerTeamsHead) {
    return <Navigate to="/dashboard" replace state={{ error: 'Access denied. Manager or team lead access required.' }} />;
  }

  return children || <Outlet />;
};

export const CustomerTeamsHeadRoute = ({ children }) => {
  const { isAuthenticated, loading, isAdmin, isProjectManager, isCustomerTeamsHead } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin && !isProjectManager && !isCustomerTeamsHead) {
    return <Navigate to="/dashboard" replace />;
  }

  return children || <Outlet />;
};

export const CustomerTeamMemberRoute = ({ children }) => {
  const { 
    isAuthenticated, 
    loading, 
    isAdmin, 
    isProjectManager, 
    isTeamLead,
    isRegularEmployee,
    isCustomerTeamsHead, 
    isCustomerTeamMember 
  } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin && !isProjectManager && !isTeamLead && !isCustomerTeamsHead && !isCustomerTeamMember && !isRegularEmployee) {
    return <Navigate to="/dashboard" replace />;
  }

  return children || <Outlet />;
};

