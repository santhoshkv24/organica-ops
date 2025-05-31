import React from 'react';
import AppRoutes from './routes';
import { AuthProvider } from './contexts/AuthContext';
import '@coreui/coreui/dist/css/coreui.min.css'; // Import CoreUI CSS
import 'bootstrap/dist/css/bootstrap.min.css'; // If using Bootstrap components alongside CoreUI
import './App.css';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;

