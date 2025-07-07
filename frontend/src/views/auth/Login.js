import React, { useState, useRef, useCallback } from 'react';
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CAlert,
  CSpinner
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilLockLocked, cilEnvelopeClosed } from '@coreui/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../../assets/images/logo-c2c2.png';
import Turnstile from '../../components/Turnstile';

// Hardcoded site key - same as in .env file
const TURNSTILE_SITE_KEY = '0x4AAAAAABi8AaTK_UF25ZzJ';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    'cf-turnstile-response': ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileError, setTurnstileError] = useState('');
  const turnstileRef = useRef(null);
  
  // Use hardcoded key instead of environment variable
  // const turnstileSiteKey = process.env.REACT_APP_CLOUDFLARE_TURNSTILE_SITE_KEY;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!credentials.email) {
      setError('Email is required');
      return false;
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(credentials.email)) {
      setError('Invalid email format');
      return false;
    } else if (!credentials.password) {
      setError('Password is required');
      return false;
    }
    return true;
  };

  const handleTurnstileVerify = useCallback((token) => {
    console.log('Turnstile verified with token:', token);
    setCredentials(prev => ({
      ...prev,
      'cf-turnstile-response': token
    }));
    setTurnstileError('');
  }, []);

  const handleTurnstileError = useCallback((error) => {
    console.error('Turnstile error:', error);
    setTurnstileError(error || 'Please complete the security check');
    // Clear any existing token on error
    setCredentials(prev => ({
      ...prev,
      'cf-turnstile-response': ''
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTurnstileError('');

    if (!validateForm()) {
      return;
    }

    // Check if Turnstile token exists
    if (!credentials['cf-turnstile-response']) {
      setTurnstileError('Please complete the security check');
      return;
    }

    try {
      setLoading(true);
      const result = await login(credentials);
      console.log('Login result:', result);
      
      if (result.success) {
        console.log('Login successful');
        
        // Check if this is a first-time login
        if (result.isFirstLogin) {
          console.log('First-time login detected, redirecting to password change');
          navigate('/set-password');
        } else {
          console.log('Regular login, navigating to dashboard');
          navigate('/dashboard');
        }
        
        console.log('Navigation called');
      } else {
        setError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Failed to log in. Please check your credentials.');
      setLoading(false);
      // Reset Turnstile on error
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
      setCredentials(prev => ({
        ...prev,
        'cf-turnstile-response': ''
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8} lg={6} xl={5}>
            <CCardGroup>
              <CCard className="p-4 shadow-lg">
                <CCardBody>
                  <div className="text-center mb-4">
                    <img src={Logo} style={{ height: '110px', marginBottom: '1rem' }} />
                    <p className="text-medium-emphasis">Sign in to your account</p>
                  </div>
                  
                  {error && <CAlert color="danger">{error}</CAlert>}
                  
                  <CForm onSubmit={handleSubmit}>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilEnvelopeClosed} />
                      </CInputGroupText>
                      <CFormInput
                        type="email"
                        placeholder="Email"
                        autoComplete="email"
                        name="email"
                        value={credentials.email}
                        onChange={handleChange}
                        required
                        invalid={!!error && !credentials.email}
                      />
                    </CInputGroup>
                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        placeholder="Password"
                        autoComplete="current-password"
                        name="password"
                        value={credentials.password}
                        onChange={handleChange}
                        required
                        invalid={!!error && !credentials.password}
                      />
                    </CInputGroup>
                    {/* Cloudflare Turnstile Widget */}
                    <div className="mb-3" style={{ minHeight: '85px' }}>
                      <Turnstile
                        ref={turnstileRef}
                        onVerify={handleTurnstileVerify}
                        onError={handleTurnstileError}
                        siteKey={TURNSTILE_SITE_KEY}
                      />
                      {turnstileError && (
                        <div className="text-danger small mt-2">
                          <i className="cil-warning me-1"></i> {turnstileError}
                        </div>
                      )}
                    </div>
                    
                    <CRow className="mt-3">
                      <CCol xs={6}>
                        <CButton 
                          type="submit" 
                          color="primary" 
                          className="px-4 w-100" 
                          disabled={loading}
                        >
                          {loading ? <CSpinner size="sm" className="me-2" /> : null}
                          {loading ? 'Signing in...' : 'Sign In'}
                        </CButton>
                      </CCol>
                      <CCol xs={6} className="text-right">
                        <Link to="/forgot-password" className="w-100 d-inline-block">
                          <CButton 
                            color="link" 
                            className="px-0 w-100 text-decoration-none"
                            disabled={loading}
                          >
                            Forgot Password?
                          </CButton>
                        </Link>
                      </CCol>
                    </CRow>
                    <CRow className="mt-3">
                      <CCol xs={12} className="text-center">
                        <Link to="/register">
                          <CButton color="light" variant="outline" className="px-0">
                            Create an Account
                          </CButton>
                        </Link>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
};

export default Login;

