import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput, CFormLabel, CRow, CSpinner } from '@coreui/react';
import { getCompanyById, createCompany, updateCompany } from '../../services/apiService';

const CompanyForm = () => {
  const { id } = useParams(); // Get ID from URL for editing
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact_phone: '', // Updated field name to match backend
    contact_email: '', // Updated field name to match backend
    // Removed fields not in the stored procedure (founded_date, fax, branch_code)
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [pageLoading, setPageLoading] = useState(false); // For loading existing data

  useEffect(() => {
    if (id) {
      // If ID exists, we are editing, fetch existing company data
      setPageLoading(true);
      getCompanyById(id)
        .then(response => {
          const company = response.data;
          // Map API response fields to our form fields
          setFormData({
            name: company.name || '',
            address: company.address || '',
            contact_phone: company.contact_phone || '',
            contact_email: company.contact_email || ''
          });
        })
        .catch(err => {
          console.error("Error fetching company:", err);
          setFormError('Failed to load company data.');
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
        // Update existing company
        await updateCompany(id, formData);
      } else {
        // Create new company
        await createCompany(formData);
      }
      navigate('/companies'); // Redirect to list after successful save
    } catch (err) {
      console.error("Error saving company:", err);
      setFormError(typeof err === 'string' ? err : 'Failed to save company. Please check the details.');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <CSpinner color="primary" />;
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>{id ? 'Edit Company' : 'Create Company'}</strong>
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
                  <CFormInput type="text" id="address" name="address" value={formData.address || ''} onChange={handleChange} />
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CFormLabel htmlFor="contact_phone" className="col-sm-2 col-form-label">Phone</CFormLabel>
                <CCol sm={10}>
                  <CFormInput type="text" id="contact_phone" name="contact_phone" value={formData.contact_phone || ''} onChange={handleChange} />
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CFormLabel htmlFor="contact_email" className="col-sm-2 col-form-label">Email</CFormLabel>
                <CCol sm={10}>
                  <CFormInput type="email" id="contact_email" name="contact_email" value={formData.contact_email || ''} onChange={handleChange} />
                </CCol>
              </CRow>
              <CRow>
                <CCol sm={{ span: 10, offset: 2 }}>
                  <CButton type="submit" color="primary" disabled={loading} className="me-2">
                    {loading ? <CSpinner size="sm" /> : (id ? 'Update' : 'Create')}
                  </CButton>
                  <CButton type="button" color="secondary" onClick={() => navigate('/companies')}>
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

export default CompanyForm;

