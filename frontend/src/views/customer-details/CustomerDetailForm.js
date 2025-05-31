import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput, CFormLabel, CFormSelect, CRow, CSpinner, CFormTextarea } from '@coreui/react';
import { getCustomerDetailById, createCustomerDetail, updateCustomerDetail, getCustomerCompanies } from '../../services/apiService';

const CustomerDetailForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    customer_company_id: '',
    gender: '',
    designation: '',
    address: '',
    mobile_no: '',
    email: '',
  });
  const [customerCompanies, setCustomerCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    setPageLoading(true);
    // Fetch customer companies for the dropdown
    getCustomerCompanies()
      .then(response => {
        const fetchedCompanies = Array.isArray(response?.data) ? response.data : [];
        setCustomerCompanies(fetchedCompanies);
        if (id) {
          // Editing: Fetch existing customer detail data
          return getCustomerDetailById(id);
        } else {
          // Creating: Set default company if available
          if (fetchedCompanies.length > 0) {
            // Optionally set a default, or leave blank
            // setFormData(prev => ({ ...prev, customer_company_id: fetchedCompanies[0].id }));
          }
          return Promise.resolve(null);
        }
      })
      .then(response => {
        if (response) { // Only set form data if editing
          const customerData = response.data;
          setFormData({
            ...customerData,
            // Ensure ID is string for select, handle null
            customer_company_id: customerData.customer_company_id?.toString() || '',
          });
        }
      })
      .catch(err => {
        console.error("Error loading data:", err);
        setFormError('Failed to load necessary data.');
      })
      .finally(() => setPageLoading(false));
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

    // Prepare data: convert IDs, handle optional fields
    const dataToSubmit = {
      ...formData,
      // Send null if company is not selected or empty
      customer_company_id: formData.customer_company_id ? parseInt(formData.customer_company_id) : null,
    };
    // Handle other optional fields that might be empty strings
    Object.keys(dataToSubmit).forEach(key => {
        if (dataToSubmit[key] === '' && key !== 'name') { // Keep name required
             dataToSubmit[key] = null;
        }
    });


    try {
      if (id) {
        await updateCustomerDetail(id, dataToSubmit);
      } else {
        await createCustomerDetail(dataToSubmit);
      }
      navigate('/customer-details');
    } catch (err) {
      console.error("Error saving customer detail:", err);
      setFormError(typeof err === 'string' ? err : 'Failed to save customer detail.');
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
            <strong>{id ? 'Edit Customer Detail' : 'Create Customer Detail'}</strong>
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
                <CFormLabel htmlFor="customer_company_id" className="col-sm-2 col-form-label">Customer Company</CFormLabel>
                <CCol sm={10}>
                  <CFormSelect
                    id="customer_company_id"
                    name="customer_company_id"
                    value={formData.customer_company_id || ''}
                    onChange={handleChange}
                    aria-label="Select Customer Company"
                  >
                    <option value="">Select Company (Optional)</option>
                    {customerCompanies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CFormLabel htmlFor="email" className="col-sm-2 col-form-label">Email</CFormLabel>
                <CCol sm={4}>
                  <CFormInput type="email" id="email" name="email" value={formData.email || ''} onChange={handleChange} />
                </CCol>
                 <CFormLabel htmlFor="mobile_no" className="col-sm-2 col-form-label">Mobile No</CFormLabel>
                <CCol sm={4}>
                  <CFormInput type="text" id="mobile_no" name="mobile_no" value={formData.mobile_no || ''} onChange={handleChange} />
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CFormLabel htmlFor="designation" className="col-sm-2 col-form-label">Designation</CFormLabel>
                <CCol sm={4}>
                  <CFormInput type="text" id="designation" name="designation" value={formData.designation || ''} onChange={handleChange} />
                </CCol>
                <CFormLabel htmlFor="gender" className="col-sm-2 col-form-label">Gender</CFormLabel>
                <CCol sm={4}>
                   <CFormSelect id="gender" name="gender" value={formData.gender || ''} onChange={handleChange} aria-label="Select Gender">
                     <option value="">Select Gender</option>
                     <option value="Male">Male</option>
                     <option value="Female">Female</option>
                     <option value="Other">Other</option>
                   </CFormSelect>
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CFormLabel htmlFor="address" className="col-sm-2 col-form-label">Address</CFormLabel>
                <CCol sm={10}>
                  <CFormTextarea id="address" name="address" value={formData.address || ''} onChange={handleChange} rows={3} />
                </CCol>
              </CRow>

              <CRow>
                <CCol sm={{ span: 10, offset: 2 }}>
                  <CButton type="submit" color="primary" disabled={loading} className="me-2">
                    {loading ? <CSpinner size="sm" /> : (id ? 'Update' : 'Create')}
                  </CButton>
                  <CButton type="button" color="secondary" onClick={() => navigate('/customer-details')}>
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

export default CustomerDetailForm;

