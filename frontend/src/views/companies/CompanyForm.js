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
    phone_no: '',
    founded_date: '',
    email: '',
    fax: '',
    branch_code: '',
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
          // Format date for input type='date'
          const formattedDate = company.founded_date ? new Date(company.founded_date).toISOString().split('T')[0] : '';
          setFormData({ ...company, founded_date: formattedDate });
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

    // Prepare data, handle empty strings vs null for optional fields if needed
    const dataToSubmit = { ...formData };
    // Convert empty date string back to null if necessary for the backend
    if (dataToSubmit.founded_date === '') {
      dataToSubmit.founded_date = null;
    }

    try {
      if (id) {
        // Update existing company
        await updateCompany(id, dataToSubmit);
      } else {
        // Create new company
        await createCompany(dataToSubmit);
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
                <CFormLabel htmlFor="phone_no" className="col-sm-2 col-form-label">Phone</CFormLabel>
                <CCol sm={10}>
                  <CFormInput type="text" id="phone_no" name="phone_no" value={formData.phone_no || ''} onChange={handleChange} />
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CFormLabel htmlFor="email" className="col-sm-2 col-form-label">Email</CFormLabel>
                <CCol sm={10}>
                  <CFormInput type="email" id="email" name="email" value={formData.email || ''} onChange={handleChange} />
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CFormLabel htmlFor="founded_date" className="col-sm-2 col-form-label">Founded Date</CFormLabel>
                <CCol sm={10}>
                  <CFormInput type="date" id="founded_date" name="founded_date" value={formData.founded_date || ''} onChange={handleChange} />
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CFormLabel htmlFor="fax" className="col-sm-2 col-form-label">Fax</CFormLabel>
                <CCol sm={10}>
                  <CFormInput type="text" id="fax" name="fax" value={formData.fax || ''} onChange={handleChange} />
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CFormLabel htmlFor="branch_code" className="col-sm-2 col-form-label">Branch Code</CFormLabel>
                <CCol sm={10}>
                  <CFormInput type="text" id="branch_code" name="branch_code" value={formData.branch_code || ''} onChange={handleChange} />
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

