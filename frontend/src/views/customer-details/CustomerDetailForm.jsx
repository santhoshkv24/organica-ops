import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput, CFormLabel, CFormSelect, CRow, CSpinner, CFormTextarea } from '@coreui/react';
import { getCustomerDetailById, createCustomerDetail, updateCustomerDetail, getCustomerCompanies } from '../../services/apiService';

const CustomerDetailForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    customer_company_id: '',
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
          // Creating: Set default company if available (optional)
          if (fetchedCompanies.length > 0) {
            // setFormData(prev => ({ ...prev, customer_company_id: fetchedCompanies[0].customer_company_id.toString() }));
          }
          return Promise.resolve(null);
        }
      })
      .then(response => {
        if (response && response.data) {
          const customerData = response.data;
          
          // Map the data to the form fields - extract name components if needed
          const nameParts = customerData.name ? customerData.name.split(' ') : ['', ''];
          const firstName = nameParts[0] || '';
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
          
          setFormData({
            first_name: customerData.first_name || firstName,
            last_name: customerData.last_name || lastName,
            email: customerData.email || '',
            phone: customerData.phone || '', // Map from phone or mobile_no
            position: customerData.position || '', // Map from position or designation
            customer_company_id: customerData.customer_company_id ? customerData.customer_company_id.toString() : '',
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

    // Prepare data to match stored procedure parameters
    const dataToSubmit = {
      customer_company_id: formData.customer_company_id ? parseInt(formData.customer_company_id, 10) : null,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      position: formData.position
    };

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
                <CFormLabel htmlFor="first_name" className="col-sm-2 col-form-label">First Name *</CFormLabel>
                <CCol sm={4}>
                  <CFormInput type="text" id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required />
                </CCol>
                <CFormLabel htmlFor="last_name" className="col-sm-2 col-form-label">Last Name *</CFormLabel>
                <CCol sm={4}>
                  <CFormInput type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required />
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
                      <option key={company.customer_company_id} value={company.customer_company_id}>
                        {company.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CFormLabel htmlFor="email" className="col-sm-2 col-form-label">Email *</CFormLabel>
                <CCol sm={4}>
                  <CFormInput type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                </CCol>
                <CFormLabel htmlFor="phone" className="col-sm-2 col-form-label">Phone</CFormLabel>
                <CCol sm={4}>
                  <CFormInput type="text" id="phone" name="phone" value={formData.phone || ''} onChange={handleChange} />
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CFormLabel htmlFor="position" className="col-sm-2 col-form-label">Position</CFormLabel>
                <CCol sm={10}>
                  <CFormInput type="text" id="position" name="position" value={formData.position || ''} onChange={handleChange} />
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

