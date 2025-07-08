  import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import theme from './theme';

import App from './App';

// CoreUI CSS
import '@coreui/coreui/dist/css/coreui.min.css';

// Additional styles
import './assets/scss/layout.scss';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </HashRouter>
    </ThemeProvider>
  </StrictMode>
);



