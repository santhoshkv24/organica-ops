import React, { useEffect, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppRoutes from './routes';
import '@coreui/coreui/dist/css/coreui.min.css'; // Import CoreUI CSS
import 'bootstrap/dist/css/bootstrap.min.css'; // If using Bootstrap components alongside CoreUI
import './App.css';

function App() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle authentication redirects
  useEffect(() => {
    if (!loading) {
      const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
      const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));
      
      console.log('Auth state in App.js:', { 
        isAuthenticated, 
        currentPath: location.pathname, 
        isPublicPath 
      });
      
      if (!isAuthenticated && !isPublicPath) {
        console.log('Not authenticated and not on public path, redirecting to login');
        navigate('/login', { replace: true });
      } else if (isAuthenticated && isPublicPath) {
        console.log('Authenticated and on public path, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, loading, location.pathname, navigate]);

  // Show loading indicator while auth state is being determined
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