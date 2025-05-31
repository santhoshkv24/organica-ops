import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
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

  return children ? children : <Outlet />; // Render children or Outlet for nested routes
};

// Optional: Specific route for Admin users
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    // Redirect non-admin users (e.g., to dashboard or a 'not authorized' page)
    // For simplicity, redirecting to dashboard here.
    // Consider creating a dedicated 'Unauthorized' page.
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />; // Render children or Outlet for nested routes
};

export { ProtectedRoute, AdminRoute };

