import React, { useState } from 'react';
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
import { cilEnvelopeClosed } from '@coreui/icons';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../../assets/images/logo-c2c2.png';
import { forgotPassword } from '../../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    // Clear error when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
    if (!email) {
      setError('Email is required');
      return false;
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      setError('Invalid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      await forgotPassword(email);
      
      setSuccess('If an account exists with this email, a password reset code has been sent to your email address.');
      navigate('/reset-password', { state: { email } });

    } catch (err) {
      console.error('Forgot password error:', err);
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
                    <p className="text-medium-emphasis">Reset your password</p>
                  </div>
                  
                  {error && <CAlert color="danger">{error}</CAlert>}
                  {success && <CAlert color="success">{success}</CAlert>}
                  
                  <CForm onSubmit={handleSubmit}>
                    <p className="text-muted mb-3">
                      Enter your email address and we'll send you instructions to reset your password.
                    </p>
                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilEnvelopeClosed} />
                      </CInputGroupText>
                      <CFormInput
                        type="email"
                        placeholder="Email"
                        autoComplete="email"
                        value={email}
                        onChange={handleChange}
                        required
                        invalid={!!error}
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
                          {loading ? 'Sending...' : 'Send Reset Link'}
                        </CButton>
                      </CCol>
                      <CCol xs={12} className="text-center">
                        <Link to="/login">
                          <CButton color="link">
                            Return to Login
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

export default ForgotPassword; 