import React, { useState, useEffect } from 'react';
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
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Logo from '../../assets/images/logo-c2c.png';
import { verifyResetCode, resetPassword } from '../../services/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = location.state?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [formValues, setFormValues] = useState({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Enter code, 2: Set new password
  const [resetToken, setResetToken] = useState(null); // Token received after code verification

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') setEmail(value);
    else if (name === 'code') setCode(value);
    else setFormValues({ ...formValues, [name]: value });
    // Clear error when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateCodeForm = () => {
    if (!email) {
      setError('Email is required');
      return false;
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      setError('Invalid email address');
      return false;
    } else if (!code) {
      setError('Verification code is required');
      return false;
    } else if (code.length !== 6) {
      setError('Verification code must be 6 digits');
      return false;
    }
    return true;
  };

  const validatePasswordForm = () => {
    if (!formValues.password) {
      setError('Password is required');
      return false;
    } else if (formValues.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    } else if (formValues.password !== formValues.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!validateCodeForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const response = await verifyResetCode(email, code);
      setResetToken(response.data.resetToken);
      setStep(2); // Move to password reset step
      setSuccess('Code verified. Please set your new password.');
    } catch (err) {
      console.error('Verify code error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await resetPassword(resetToken, formValues.password);
      setSuccess('Your password has been reset successfully.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
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
                    <h1 className="fw-bold">C2C Portal</h1>
                    <p className="text-medium-emphasis">Set new password</p>
                  </div>
                  
                  {error && <CAlert color="danger">{error}</CAlert>}
                  {success && <CAlert color="success">{success}</CAlert>}
                  
                  {step === 1 && (
                    <CForm onSubmit={handleVerifyCode}>
                      <p className="text-muted mb-3">
                        Enter the email address associated with your account and the 6-digit verification code sent to you.
                      </p>
                      <CInputGroup className="mb-3">
                        <CInputGroupText>
                          <CIcon icon={cilEnvelopeClosed} />
                        </CInputGroupText>
                        <CFormInput
                          type="email"
                          placeholder="Email"
                          name="email"
                          autoComplete="email"
                          value={email}
                          onChange={handleChange}
                          required
                          invalid={!!error && !email}
                          disabled={!!initialEmail}
                        />
                      </CInputGroup>
                      <CInputGroup className="mb-4">
                        <CInputGroupText>
                          <CIcon icon={cilLockLocked} />
                        </CInputGroupText>
                        <CFormInput
                          type="text"
                          placeholder="6-digit Code"
                          name="code"
                          autoComplete="off"
                          value={code}
                          onChange={handleChange}
                          required
                          invalid={!!error && !code}
                          maxLength={6}
                        />
                      </CInputGroup>
                      <CRow>
                        <CCol xs={12} className="text-center mb-3">
                          <CButton 
                            type="submit" 
                            color="primary" 
                            className="px-4" 
                            disabled={loading}
                          >
                            {loading ? <CSpinner size="sm" className="me-2" /> : null}
                            {loading ? 'Verifying...' : 'Verify Code'}
                          </CButton>
                        </CCol>
                      </CRow>
                    </CForm>
                  )}

                  {step === 2 && (
                    <CForm onSubmit={handleResetPassword}>
                      <p className="text-muted mb-3">
                        Enter your new password below.
                      </p>
                      <CInputGroup className="mb-3">
                        <CInputGroupText>
                          <CIcon icon={cilLockLocked} />
                        </CInputGroupText>
                        <CFormInput
                          type="password"
                          placeholder="New Password"
                          name="password"
                          autoComplete="new-password"
                          value={formValues.password}
                          onChange={handleChange}
                          required
                          invalid={!!error && !formValues.password}
                        />
                      </CInputGroup>
                      <CInputGroup className="mb-4">
                        <CInputGroupText>
                          <CIcon icon={cilLockLocked} />
                        </CInputGroupText>
                        <CFormInput
                          type="password"
                          placeholder="Confirm Password"
                          name="confirmPassword"
                          autoComplete="new-password"
                          value={formValues.confirmPassword}
                          onChange={handleChange}
                          required
                          invalid={!!error && formValues.password !== formValues.confirmPassword}
                        />
                      </CInputGroup>
                      <CRow>
                        <CCol xs={12} className="text-center mb-3">
                          <CButton 
                            type="submit" 
                            color="primary" 
                            className="px-4" 
                            disabled={loading}
                          >
                            {loading ? <CSpinner size="sm" className="me-2" /> : null}
                            {loading ? 'Resetting...' : 'Reset Password'}
                          </CButton>
                        </CCol>
                      </CRow>
                    </CForm>
                  )}
                  
                  <div className="text-center mt-3">
                    <Link to="/login">
                      <CButton color="link">
                        Return to Login
                      </CButton>
                    </Link>
                  </div>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
};

export default ResetPassword; 