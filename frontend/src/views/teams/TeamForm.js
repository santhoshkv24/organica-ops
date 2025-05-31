import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput, CFormLabel, CFormSelect, CRow, CSpinner, CFormTextarea } from '@coreui/react';
import { getTeamById, createTeam, updateTeam, getDepartments, getCompanies } from '../../services/apiService';

const TeamForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    department_id: '',
    company_id: '', // Added company_id
    description: '',
  });
  const [departments, setDepartments] = useState([]);
  const [companies, setCompanies] = useState([]); // Added companies state
  const [filteredDepartments, setFilteredDepartments] = useState([]); // Departments filtered by company
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    setPageLoading(true);
    // Fetch companies and departments first
    Promise.all([getCompanies(), getDepartments()])
      .then(([compResponse, deptResponse]) => {
        const fetchedCompanies = Array.isArray(compResponse?.data) ? compResponse.data : [];
        const fetchedDepartments = Array.isArray(deptResponse?.data) ? deptResponse.data : [];
        setCompanies(fetchedCompanies);
        setDepartments(fetchedDepartments);

        if (id) {
          // If editing, fetch existing team data
          return getTeamById(id);
        } else {
          // If creating, set default company/department if available
          if (fetchedCompanies.length > 0) {
            const defaultCompanyId = fetchedCompanies[0].id;
            setFormData(prev => ({ ...prev, company_id: defaultCompanyId }));
            // Filter departments for the default company
            const initialFilteredDepts = fetchedDepartments.filter(dept => dept.company_id === defaultCompanyId);
            setFilteredDepartments(initialFilteredDepts);
            if (initialFilteredDepts.length > 0) {
              setFormData(prev => ({ ...prev, department_id: initialFilteredDepts[0].id }));
            }
          }
          return Promise.resolve(null); // Resolve null if creating
        }
      })
      .then(response => {
        if (response) { // Only set form data if editing
          const teamData = response.data;
          setFormData(teamData);
          // Filter departments based on the team's company
          const currentFilteredDepts = departments.filter(dept => dept.company_id === teamData.company_id);
          setFilteredDepartments(currentFilteredDepts);
        }
      })
      .catch(err => {
        console.error("Error loading data:", err);
        setFormError('Failed to load necessary data.');
      })
      .finally(() => setPageLoading(false));
  }, [id]); // Rerun if ID changes, but departments dependency is handled internally

  // Effect to filter departments when company changes
  useEffect(() => {
    if (formData.company_id) {
      const newFilteredDepts = departments.filter(dept => dept.company_id === parseInt(formData.company_id));
      setFilteredDepartments(newFilteredDepts);
      // Reset department selection if the current one is not in the new list
      if (!newFilteredDepts.find(dept => dept.id === parseInt(formData.department_id))) {
        setFormData(prev => ({ ...prev, department_id: newFilteredDepts.length > 0 ? newFilteredDepts[0].id : '' }));
      }
    } else {
      setFilteredDepartments([]); // Clear departments if no company selected
      setFormData(prev => ({ ...prev, department_id: '' }));
    }
  }, [formData.company_id, departments]);

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

    if (!formData.company_id || !formData.department_id) {
        setFormError('Please select both a company and a department.');
        setLoading(false);
        return;
    }

    // Ensure IDs are numbers if required by backend
    const dataToSubmit = {
        ...formData,
        company_id: parseInt(formData.company_id),
        department_id: parseInt(formData.department_id),
    };

    try {
      if (id) {
        await updateTeam(id, dataToSubmit);
      } else {
        await createTeam(dataToSubmit);
      }
      navigate('/teams');
    } catch (err) {
      console.error("Error saving team:", err);
      setFormError(typeof err === 'string' ? err : 'Failed to save team.');
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
            <strong>{id ? 'Edit Team' : 'Create Team'}</strong>
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
                <CFormLabel htmlFor="department_id" className="col-sm-2 col-form-label">Department *</CFormLabel>
                <CCol sm={10}>
                  <CFormSelect
                    id="department_id"
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleChange}
                    required
                    disabled={!formData.company_id || filteredDepartments.length === 0} // Disable if no company or filtered depts
                    aria-label="Select Department"
                  >
                    <option value="">Select a Department</option>
                    {filteredDepartments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </CFormSelect>
                  {!formData.company_id && <small className='text-muted'>Please select a company first.</small>}
                  {formData.company_id && filteredDepartments.length === 0 && <small className='text-danger'>No departments found for the selected company.</small>}
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
                  <CButton type="submit" color="primary" disabled={loading || !formData.department_id} className="me-2">
                    {loading ? <CSpinner size="sm" /> : (id ? 'Update' : 'Create')}
                  </CButton>
                  <CButton type="button" color="secondary" onClick={() => navigate('/teams')}>
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

export default TeamForm;

