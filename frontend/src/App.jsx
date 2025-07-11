import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppRoutes from './routes';

import '@coreui/coreui/dist/css/coreui.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
      const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));

      if (!isAuthenticated && !isPublicPath) {
        navigate('/login', { replace: true });
      } else if (isAuthenticated && isPublicPath) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return <AppRoutes />;
}

export default App;
