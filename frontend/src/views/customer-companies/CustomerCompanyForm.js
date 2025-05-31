import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput, CFormLabel, CRow, CSpinner, CFormTextarea } from '@coreui/react';
import { getCustomerCompanyById, createCustomerCompany, updateCustomerCompany } from '../../services/apiService';

const CustomerCompanyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone_no: '',
    email: '',
    industry: '',
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setPageLoading(true);
      getCustomerCompanyById(id)
        .then(response => {
          setFormData(response.data);
        })
        .catch(err => {
          console.error("Error fetching customer company:", err);
          setFormError('Failed to load customer company data.');
        })
        .finally(() => setPageLoading(false));
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');

    try {
      if (id) {
        await updateCustomerCompany(id, formData);
      } else {
        await createCustomerCompany(formData);
      }
      navigate('/customer-companies');
    } catch (err) {
      console.error("Error saving customer company:", err);
      setFormError(typeof err === 'string' ? err : 'Failed to save customer company.');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <div className="text-center"><CSpinner color="primary" /></div>;
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>{id ? 'Edit Customer Company' : 'Create Customer Company'}</strong>
          </CCardHeader>
          <CCardBody>
            {formError && <p className="text-danger">{formError}</p>}
            <CForm onSubmit={handleSubmit}>
              <CRow className="mb-3">
                <CFormLabel htmlFor="name" className="col-sm-2 col-form-label">Name *</CFormLabel>
                <CCol sm={10}>
                  <CFormInput type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CFormLabel htmlFor="address" className="col-sm-2 col-form-label">Address</CFormLabel>
                <CCol sm={10}>
                  <CFormTextarea id="address" name="address" value={formData.address || ''} onChange={handleChange} rows={3} />
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CFormLabel htmlFor="phone_no" className="col-sm-2 col-form-label">Phone</CFormLabel>
                <CCol sm={4}>
                  <CFormInput type="text" id="phone_no" name="phone_no" value={formData.phone_no || ''} onChange={handleChange} />
                </CCol>
                <CFormLabel htmlFor="email" className="col-sm-2 col-form-label">Email</CFormLabel>
                <CCol sm={4}>
                  <CFormInput type="email" id="email" name="email" value={formData.email || ''} onChange={handleChange} />
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CFormLabel htmlFor="industry" className="col-sm-2 col-form-label">Industry</CFormLabel>
                <CCol sm={10}>
                  <CFormInput type="text" id="industry" name="industry" value={formData.industry || ''} onChange={handleChange} />
                </CCol>
              </CRow>
              <CRow>
                <CCol sm={{ span: 10, offset: 2 }}>
                  <CButton type="submit" color="primary" disabled={loading} className="me-2">
                    {loading ? <CSpinner size="sm" /> : (id ? 'Update' : 'Create')}
                  </CButton>
                  <CButton type="button" color="secondary" onClick={() => navigate('/customer-companies')}>
                    Cancel
                  </CButton>
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default CustomerCompanyForm;

