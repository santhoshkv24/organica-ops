import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput, CFormLabel, CFormSelect, CRow, CSpinner, CFormTextarea } from '@coreui/react';
import { getDepartmentById, createDepartment, updateDepartment, getCompanies } from '../../services/apiService';

const DepartmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    company_id: '',
    description: '',
  });
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    setPageLoading(true);
    // Fetch companies for the dropdown
    getCompanies()
      .then(response => {
        setCompanies(Array.isArray(response?.data) ? response.data : []);
        if (id) {
          // If editing, fetch existing department data
          return getDepartmentById(id);
        } else {
          // If creating, set default company if available
          if (response?.data?.length > 0) {
            setFormData(prev => ({ ...prev, company_id: response.data[0].id }));
          }
          return Promise.resolve(null); // Resolve null if creating
        }
      })
      .then(response => {
        if (response) { // Only set form data if editing
          setFormData(response.data);
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

    if (!formData.company_id) {
        setFormError('Please select a company.');
        setLoading(false);
        return;
    }

    try {
      if (id) {
        await updateDepartment(id, formData);
      } else {
        await createDepartment(formData);
      }
      navigate('/departments');
    } catch (err) {
      console.error("Error saving department:", err);
      setFormError(typeof err === 'string' ? err : 'Failed to save department.');
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
            <strong>{id ? 'Edit Department' : 'Create Department'}</strong>
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
                <CFormLabel htmlFor="company_id" className="col-sm-2 col-form-label">Company *</CFormLabel>
                <CCol sm={10}>
                  <CFormSelect
                    id="company_id"
                    name="company_id"
                    value={formData.company_id}
                    onChange={handleChange}
                    required
                    aria-label="Select Company"
                  >
                    <option value="">Select a Company</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CFormLabel htmlFor="description" className="col-sm-2 col-form-label">Description</CFormLabel>
                <CCol sm={10}>
                  <CFormTextarea id="description" name="description" value={formData.description || ''} onChange={handleChange} rows={3} />
                </CCol>
              </CRow>
              <CRow>
                <CCol sm={{ span: 10, offset: 2 }}>
                  <CButton type="submit" color="primary" disabled={loading} className="me-2">
                    {loading ? <CSpinner size="sm" /> : (id ? 'Update' : 'Create')}
                  </CButton>
                  <CButton type="button" color="secondary" onClick={() => navigate('/departments')}>
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

export default DepartmentForm;

