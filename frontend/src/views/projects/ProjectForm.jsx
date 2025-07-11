import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CSpinner,
  CFormTextarea
} from '@coreui/react';
import {
  getProjectById,
  createProject,
  updateProject,
  getCompanies, 
  getEmployees,
  getUsers,
  getCustomerCompanies // Added getCustomerCompanies
} from '../../services/api'; // Assuming consolidated API service

// Map of status values to ensure consistency with database ENUM
export const PROJECT_STATUS = {
  PLANNING: 'planning',
  IN_PROGRESS: 'in_progress',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const STATUS_OPTIONS = [
  { value: PROJECT_STATUS.PLANNING, label: 'Planning' },
  { value: PROJECT_STATUS.IN_PROGRESS, label: 'In Progress' },
  { value: PROJECT_STATUS.ON_HOLD, label: 'On Hold' },
  { value: PROJECT_STATUS.COMPLETED, label: 'Completed' },
  { value: PROJECT_STATUS.CANCELLED, label: 'Cancelled' },
];

const ProjectForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    customer_company_id: '', // Added customer_company_id
    project_manager_id: '',
    status: PROJECT_STATUS.PLANNING, // Default status
    start_date: '',
    end_date: '',
    description: '',
    budget: '' // Added budget
  });

  const [branches, setBranches] = useState([]); // Still fetch branches for manager filtering etc.
  const [customerCompanies, setCustomerCompanies] = useState([]); // State for customer companies
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [pageLoading, setPageLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    setPageLoading(true);

    // Fetch all necessary data: branches, employees, users, and customer companies
    Promise.all([
      getCompanies(), // Use getBranches
      getEmployees(),
      getUsers(),
      getCustomerCompanies() // Fetch customer companies
    ])
      .then(([companiesRes, employeesRes, usersRes, customerCompaniesRes]) => {
        // Process branches
        const companiesData = companiesRes?.data?.data || companiesRes?.data || [];
        setBranches(companiesData);

        // Process customer companies
        const customerCompaniesData = customerCompaniesRes?.data?.data || customerCompaniesRes?.data || [];
        setCustomerCompanies(customerCompaniesData);

        // Process employees and users to get managers
        const employeesData = employeesRes?.data?.data || employeesRes?.data || [];
        const usersData = usersRes?.data?.data || usersRes?.data || [];

        // Filter employees who are managers or admins
        const managersList = employeesData
          .filter(emp => {
            const userEntry = usersData.find(u => u.employee_id === emp.employee_id);
            return userEntry && ['admin', 'manager'].includes(userEntry.role);
          })
          .map(emp => ({
            value: emp.employee_id,
            label: `${emp.first_name} ${emp.last_name} (${emp.position})`
          }));

        setManagers(managersList);

        // If editing, fetch existing project data
        if (id) {
          return getProjectById(id)
            .then(response => {
              if (response && response.data) {
                const projectData = response.data;

                // Set form data
                setFormData({
                  name: projectData.name || '',
                  customer_company_id: projectData.customer_company_id ? projectData.customer_company_id.toString() : '', // Populate customer company
                  project_manager_id: projectData.project_manager_id ? projectData.project_manager_id.toString() : '',
                  status: projectData.status || PROJECT_STATUS.PLANNING, // Default if status is null
                  start_date: projectData.start_date ? new Date(projectData.start_date).toISOString().split('T')[0] : '',
                  end_date: projectData.end_date ? new Date(projectData.end_date).toISOString().split('T')[0] : '',
                  description: projectData.description || '',
                  budget: projectData.budget !== null && projectData.budget !== undefined ? projectData.budget.toString() : '' // Populate budget
                });
              }
              return null;
            });
        } else {
          // If creating new project, set default status
          setFormData(prev => ({
            ...prev,
            status: PROJECT_STATUS.PLANNING // Set default status for new projects
          }));
          return null; // No additional async operations for new project
        }
      })
      .catch(err => {
        console.error("Error loading data:", err);
        setFormError('Failed to load necessary data.');
      })
      .finally(() => setPageLoading(false));
  }, [id]); // Depend on id

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');

    // Validate required fields
    if (!formData.name || !formData.customer_company_id || !formData.project_manager_id || !formData.status) {
      setFormError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    // Prepare data for submission
    const dataToSubmit = {
      name: formData.name,
      customer_company_id: parseInt(formData.customer_company_id, 10),
      project_manager_id: parseInt(formData.project_manager_id, 10),
      status: formData.status,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      description: formData.description || '',
      budget: formData.budget !== '' ? parseFloat(formData.budget) : null // Parse budget
    };

    console.log('Submitting project data:', dataToSubmit);

    try {
      if (id) {
        await updateProject(id, dataToSubmit);
      } else {
        await createProject(dataToSubmit);
      }
      navigate('/projects');
    } catch (err) {
      console.error("Error saving project:", err);
      // Check if the error object has a 'message' property
      setFormError(err && typeof err.message === 'string' ? err.message : (typeof err === 'string' ? err : 'Failed to save project.'));

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
            <strong>{id ? 'Edit Project' : 'Create Project'}</strong>
          </CCardHeader>
          <CCardBody>
            {formError && <p className="text-danger">{formError}</p>}
            <CForm onSubmit={handleSubmit}>
              <CRow className="mb-3">
                <CFormLabel htmlFor="name" className="col-sm-2 col-form-label">Project Name *</CFormLabel>
                <CCol sm={10}>
                  <CFormInput
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </CCol>
              </CRow>

              {/* Customer Company Select */}
              <CRow className="mb-3">
                <CFormLabel htmlFor="customer_company_id" className="col-sm-2 col-form-label">Customer Company *</CFormLabel>
                <CCol sm={10}>
                  <CFormSelect
                    id="customer_company_id"
                    name="customer_company_id"
                    value={formData.customer_company_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a Customer Company</option>
                    {customerCompanies.map(company => (
                      <option
                        key={company.customer_company_id}
                        value={company.customer_company_id}
                      >
                        {company.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>

              {/* Project Manager Select */}
              <CRow className="mb-3">
                <CFormLabel htmlFor="project_manager_id" className="col-sm-2 col-form-label">Project Manager *</CFormLabel>
                <CCol sm={10}>
                  <CFormSelect
                    id="project_manager_id"
                    name="project_manager_id"
                    value={formData.project_manager_id}
                    onChange={handleChange}
                    required
                    className="mb-3"
                  >
                    <option value="">Select a Manager</option>
                    {managers.map(manager => (
                      <option key={manager.value} value={manager.value}>
                        {manager.label}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>

              {/* Start Date */}
              <CRow className="mb-3">
                <CFormLabel htmlFor="start_date" className="col-sm-2 col-form-label">Start Date</CFormLabel>
                <CCol sm={10}>
                  <CFormInput
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                  />
                </CCol>
              </CRow>

              {/* End Date */}
              <CRow className="mb-3">
                <CFormLabel htmlFor="end_date" className="col-sm-2 col-form-label">End Date</CFormLabel>
                <CCol sm={10}>
                  <CFormInput
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                  />
                </CCol>
              </CRow>

              {/* Budget */}
              <CRow className="mb-3">
                <CFormLabel htmlFor="budget" className="col-sm-2 col-form-label">Budget</CFormLabel>
                <CCol sm={10}>
                  <CFormInput
                    type="number"
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    step="0.01" // Allow decimal values
                  />
                </CCol>
              </CRow>

              {/* Status */}
              <CRow className="mb-3">
                <CFormLabel htmlFor="status" className="col-sm-2 col-form-label">Status *</CFormLabel>
                <CCol sm={10}>
                  <CFormSelect
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    {STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>

              {/* Description */}
              <CRow className="mb-3">
                <CFormLabel htmlFor="description" className="col-sm-2 col-form-label">Description</CFormLabel>
                <CCol sm={10}>
                  <CFormTextarea
                    id="description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    rows={3}
                  />
                </CCol>
              </CRow>

              <CRow>
                <CCol sm={{ span: 10, offset: 2 }}>
                  <CButton
                    type="submit"
                    color="primary"
                    disabled={loading}
                    className="me-2"
                  >
                    {loading ? <CSpinner size="sm" /> : (id ? 'Update' : 'Create')}
                  </CButton>
                  <CButton
                    type="button"
                    color="secondary"
                    onClick={() => navigate('/projects')}
                  >
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

export default ProjectForm;
