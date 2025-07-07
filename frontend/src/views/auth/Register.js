import React, { useState, useRef } from 'react';
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
import { cilUser, cilLockLocked, cilEnvelopeClosed, cilPhone, cilBriefcase } from '@coreui/icons';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../services/api';
import Logo from '../../assets/images/logo-c2c2.png';
import Turnstile from '../../components/Turnstile';

const Register = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    'cf-turnstile-response': ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileError, setTurnstileError] = useState('');
  const turnstileRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formValues.username) {
      setError('Username is required');
      return false;
    }
    if (!formValues.email) {
      setError('Email is required');
      return false;
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formValues.email)) {
      setError('Invalid email address');
      return false;
    }
    if (!formValues.password) {
      setError('Password is required');
      return false;
    } else if (formValues.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (formValues.password !== formValues.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleTurnstileVerify = (token) => {
    setFormValues(prev => ({
      ...prev,
      'cf-turnstile-response': token
    }));
    setTurnstileError('');
  };

  const handleTurnstileError = () => {
    setTurnstileError('Please complete the security check');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!formValues['cf-turnstile-response']) {
      setTurnstileError('Please complete the security check');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      const response = await registerUser({
        username: formValues.username,
        email: formValues.email,
        password: formValues.password,
        'cf-turnstile-response': formValues['cf-turnstile-response']
      });

      if (response.success) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.message || 'Registration failed. Please try again.');
        // Reset Turnstile on error
        if (turnstileRef.current) {
          turnstileRef.current.reset();
        }
        setFormValues(prev => ({
          ...prev,
          'cf-turnstile-response': ''
        }));
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'An error occurred during registration.');
      // Reset Turnstile on error
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
      setFormValues(prev => ({
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
          <CCol md={9} lg={7} xl={6}>
            <CCardGroup>
              <CCard className="p-4 shadow-lg">
                <CCardBody>
                  <div className="text-center mb-4">
                    <img src={Logo} style={{ height: '110px', marginBottom: '1rem' }} />
                    <p className="text-medium-emphasis">Create your account</p>
                  </div>
                  
                  {error && <CAlert color="danger">{error}</CAlert>}
                  {success && <CAlert color="success">{success}</CAlert>}
                  
                <CForm onSubmit={handleSubmit}>
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                        <CIcon icon={cilUser} />
                    </CInputGroupText>
                      <CFormInput
                        name="username"
                        placeholder="Username"
                        autoComplete="username"
                        value={formValues.username}
                        onChange={handleChange}
                        required
                      />
                    </CInputGroup>
                    
                    <CInputGroup className="mb-3">
                      <CInputGroupText>@</CInputGroupText>
                    <CFormInput
                      type="email"
                        name="email"
                      placeholder="Email"
                      autoComplete="email"
                        value={formValues.email}
                        onChange={handleChange}
                      required
                    />
                  </CInputGroup>

                    
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                        name="password"
                      placeholder="Password"
                      autoComplete="new-password"
                        value={formValues.password}
                        onChange={handleChange}
                      required
                    />
                  </CInputGroup>
                    
                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                      autoComplete="new-password"
                        value={formValues.confirmPassword}
                        onChange={handleChange}
                      required
                    />
                  </CInputGroup>
                    
                    {/* Turnstile Widget */}
                    <div className="mb-3">
                      <Turnstile
                        ref={turnstileRef}
                        onVerify={handleTurnstileVerify}
                        onError={handleTurnstileError}
                      />
                      {turnstileError && <div className="text-danger small mt-1">{turnstileError}</div>}
                    </div>
                    
                    <CRow className="mt-3">
                      <CCol xs={12} className="text-center mb-3">
                        <CButton 
                          type="submit" 
                          color="success" 
                          className="px-4 w-100" 
                          disabled={loading}
                        >
                          {loading ? <CSpinner size="sm" className="me-2" /> : null}
                          {loading ? 'Creating Account...' : 'Create Account'}
                        </CButton>
                      </CCol>
                      <CCol xs={12} className="text-center">
                        <p>Already have an account?{' '}
                          <Link to="/login" className="text-decoration-none">
                            <strong>Sign In</strong>
                          </Link>
                        </p>
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

export default Register;

