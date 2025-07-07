import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

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
    <HashRouter>
      <AuthProvider>
      <App />
    </AuthProvider>
    </HashRouter>
  </StrictMode>
);

// Remove reportWebVitals call - we're not using it
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals

