import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput, CFormLabel, CFormSelect, CRow, CSpinner, CFormTextarea } from '@coreui/react';
import { getEmployeeById, createEmployee, updateEmployee, getCompanies, getDepartments, getTeams } from '../../services/apiService';

const EmployeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company_id: '',
    department_id: '',
    team_id: '',
    age: '',
    gender: '',
    phone_number: '',
    role: '',
    address: '',
    company_email_id: '',
    qualification: '',
  });
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [pageLoading, setPageLoading] = useState(false);

  // Fetch initial data (Companies, Departments, Teams) and existing Employee data if editing
  useEffect(() => {
    setPageLoading(true);
    Promise.all([getCompanies(), getDepartments(), getTeams()])
      .then(([compRes, deptRes, teamRes]) => {
        const fetchedCompanies = Array.isArray(compRes?.data) ? compRes.data : [];
        const fetchedDepartments = Array.isArray(deptRes?.data) ? deptRes.data : [];
        const fetchedTeams = Array.isArray(teamRes?.data) ? teamRes.data : [];
        setCompanies(fetchedCompanies);
        setDepartments(fetchedDepartments);
        setTeams(fetchedTeams);

        if (id) {
          // Editing: Fetch employee data
          return getEmployeeById(id);
        } else {
          // Creating: Set defaults if possible
          if (fetchedCompanies.length > 0) {
            const defaultCompanyId = fetchedCompanies[0].id;
            setFormData(prev => ({ ...prev, company_id: defaultCompanyId }));
            // Trigger initial filtering based on default company
            const initialFilteredDepts = fetchedDepartments.filter(dept => dept.company_id === defaultCompanyId);
            setFilteredDepartments(initialFilteredDepts);
            if (initialFilteredDepts.length > 0) {
              const defaultDeptId = initialFilteredDepts[0].id;
              setFormData(prev => ({ ...prev, department_id: defaultDeptId }));
              const initialFilteredTeams = fetchedTeams.filter(team => team.department_id === defaultDeptId);
              setFilteredTeams(initialFilteredTeams);
              if (initialFilteredTeams.length > 0) {
                 setFormData(prev => ({ ...prev, team_id: initialFilteredTeams[0].id }));
              }
            }
          }
          return Promise.resolve(null);
        }
      })
      .then(empRes => {
        if (empRes) { // If editing, set form data
          const employeeData = empRes.data;
          setFormData({
            ...employeeData,
            // Ensure IDs are strings for select inputs
            company_id: employeeData.company_id?.toString() || '',
            department_id: employeeData.department_id?.toString() || '',
            team_id: employeeData.team_id?.toString() || '',
            age: employeeData.age || '', // Handle null age
          });
          // Trigger filtering based on loaded employee data
          const currentFilteredDepts = departments.filter(dept => dept.company_id === employeeData.company_id);
          setFilteredDepartments(currentFilteredDepts);
          const currentFilteredTeams = teams.filter(team => team.department_id === employeeData.department_id);
          setFilteredTeams(currentFilteredTeams);
        }
      })
      .catch(err => {
        console.error("Error loading data:", err);
        setFormError('Failed to load necessary data.');
      })
      .finally(() => setPageLoading(false));
  }, [id]); // Dependencies: id, but others are fetched once

  // Filter Departments when Company changes
  useEffect(() => {
    if (formData.company_id) {
      const companyIdNum = parseInt(formData.company_id);
      const newFilteredDepts = departments.filter(dept => dept.company_id === companyIdNum);
      setFilteredDepartments(newFilteredDepts);
      // Reset department and team if company changes
      if (!newFilteredDepts.find(dept => dept.id === parseInt(formData.department_id))) {
         setFormData(prev => ({ ...prev, department_id: '', team_id: '' }));
         setFilteredTeams([]); // Clear teams as well
      }
    } else {
      setFilteredDepartments([]);
      setFilteredTeams([]);
      setFormData(prev => ({ ...prev, department_id: '', team_id: '' }));
    }
  }, [formData.company_id, departments]);

  // Filter Teams when Department changes
  useEffect(() => {
    if (formData.department_id) {
      const departmentIdNum = parseInt(formData.department_id);
      const newFilteredTeams = teams.filter(team => team.department_id === departmentIdNum);
      setFilteredTeams(newFilteredTeams);
      // Reset team if department changes
      if (!newFilteredTeams.find(team => team.id === parseInt(formData.team_id))) {
        setFormData(prev => ({ ...prev, team_id: '' }));
      }
    } else {
      setFilteredTeams([]);
      setFormData(prev => ({ ...prev, team_id: '' }));
    }
  }, [formData.department_id, teams]);

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

    // Prepare data: convert IDs to numbers, handle optional fields
    const dataToSubmit = {
      ...formData,
      company_id: parseInt(formData.company_id),
      // Handle optional fields - send null if empty string, otherwise parse int
      department_id: formData.department_id ? parseInt(formData.department_id) : null,
      team_id: formData.team_id ? parseInt(formData.team_id) : null,
      age: formData.age ? parseInt(formData.age) : null,
    };
    // Remove empty strings for other optional fields if backend expects null
    Object.keys(dataToSubmit).forEach(key => {
        if (dataToSubmit[key] === '') {
            // Keep required fields even if empty for validation, handle others
            if (!['name', 'company_id', 'email'].includes(key)) { // Adjust required fields as needed
                 dataToSubmit[key] = null;
            }
        }
    });

    try {
      if (id) {
        await updateEmployee(id, dataToSubmit);
      } else {
        await createEmployee(dataToSubmit);
      }
      navigate('/employees');
    } catch (err) {
      console.error("Error saving employee:", err);
      setFormError(typeof err === 'string' ? err : 'Failed to save employee.');
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
            <strong>{id ? 'Edit Employee' : 'Create Employee'}</strong>
          </CCardHeader>
          <CCardBody>
            {formError && <p className="text-danger">{formError}</p>}
            <CForm onSubmit={handleSubmit}>
              {/* Basic Info */}
              <CRow className="mb-3">
                <CFormLabel htmlFor="name" className="col-sm-2 col-form-label">Name *</CFormLabel>
                <CCol sm={4}>
                  <CFormInput type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                </CCol>
                <CFormLabel htmlFor="email" className="col-sm-2 col-form-label">Personal Email</CFormLabel>
                <CCol sm={4}>
                  <CFormInput type="email" id="email" name="email" value={formData.email || ''} onChange={handleChange} />
                </CCol>
              </CRow>
              <CRow className="mb-3">
                 <CFormLabel htmlFor="age" className="col-sm-2 col-form-label">Age</CFormLabel>
                <CCol sm={4}>
                  <CFormInput type="number" id="age" name="age" value={formData.age || ''} onChange={handleChange} min="18" max="100" />
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
                <CFormLabel htmlFor="phone_number" className="col-sm-2 col-form-label">Phone Number</CFormLabel>
                <CCol sm={4}>
                  <CFormInput type="text" id="phone_number" name="phone_number" value={formData.phone_number || ''} onChange={handleChange} />
                </CCol>
                 <CFormLabel htmlFor="address" className="col-sm-2 col-form-label">Address</CFormLabel>
                <CCol sm={4}>
                  <CFormTextarea id="address" name="address" value={formData.address || ''} onChange={handleChange} rows={1} />
                </CCol>
              </CRow>

              {/* Company Assignment */}
              <CRow className="mb-3">
                <CFormLabel htmlFor="company_id" className="col-sm-2 col-form-label">Company *</CFormLabel>
                <CCol sm={4}>
                  <CFormSelect id="company_id" name="company_id" value={formData.company_id} onChange={handleChange} required aria-label="Select Company">
                    <option value="">Select Company</option>
                    {companies.map(comp => <option key={comp.id} value={comp.id}>{comp.name}</option>)}
                  </CFormSelect>
                </CCol>
                 <CFormLabel htmlFor="company_email_id" className="col-sm-2 col-form-label">Company Email</CFormLabel>
                <CCol sm={4}>
                  <CFormInput type="email" id="company_email_id" name="company_email_id" value={formData.company_email_id || ''} onChange={handleChange} />
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CFormLabel htmlFor="department_id" className="col-sm-2 col-form-label">Department</CFormLabel>
                <CCol sm={4}>
                  <CFormSelect id="department_id" name="department_id" value={formData.department_id || ''} onChange={handleChange} disabled={!formData.company_id || filteredDepartments.length === 0} aria-label="Select Department">
                    <option value="">Select Department (Optional)</option>
                    {filteredDepartments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                  </CFormSelect>
                  {!formData.company_id && <small className='text-muted'>Select a company first.</small>}
                  {formData.company_id && filteredDepartments.length === 0 && <small className='text-warning'>No departments for this company.</small>}
                </CCol>
                <CFormLabel htmlFor="team_id" className="col-sm-2 col-form-label">Team</CFormLabel>
                <CCol sm={4}>
                  <CFormSelect id="team_id" name="team_id" value={formData.team_id || ''} onChange={handleChange} disabled={!formData.department_id || filteredTeams.length === 0} aria-label="Select Team">
                    <option value="">Select Team (Optional)</option>
                    {filteredTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                  </CFormSelect>
                  {!formData.department_id && <small className='text-muted'>Select a department first.</small>}
                   {formData.department_id && filteredTeams.length === 0 && <small className='text-warning'>No teams for this department.</small>}
                </CCol>
              </CRow>

              {/* Role & Qualification */}
              <CRow className="mb-3">
                <CFormLabel htmlFor="role" className="col-sm-2 col-form-label">Role</CFormLabel>
                <CCol sm={4}>
                  <CFormInput type="text" id="role" name="role" value={formData.role || ''} onChange={handleChange} />
                </CCol>
                <CFormLabel htmlFor="qualification" className="col-sm-2 col-form-label">Qualification</CFormLabel>
                <CCol sm={4}>
                  <CFormInput type="text" id="qualification" name="qualification" value={formData.qualification || ''} onChange={handleChange} />
                </CCol>
              </CRow>

              {/* Action Buttons */}
              <CRow>
                <CCol sm={{ span: 10, offset: 2 }}>
                  <CButton type="submit" color="primary" disabled={loading} className="me-2">
                    {loading ? <CSpinner size="sm" /> : (id ? 'Update' : 'Create')}
                  </CButton>
                  <CButton type="button" color="secondary" onClick={() => navigate('/employees')}>
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

export default EmployeeForm;

