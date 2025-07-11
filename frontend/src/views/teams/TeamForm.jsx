import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput, CFormLabel, CFormSelect, CRow, CSpinner, CFormTextarea } from '@coreui/react';
import { getTeamById, createTeam, updateTeam, getCompanies } from '../../services/api';

const TeamForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    branch_id: '',
    description: '',
  });
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    setPageLoading(true);
    // Fetch branches first
    getCompanies()
      .then((response) => {
        const fetchedBranches = response?.data?.data || response?.data || [];
        setBranches(fetchedBranches);

        if (id) {
          // If editing, fetch existing team data
          return getTeamById(id);
        } else {
          // If creating, set default branch if available
          if (fetchedBranches.length > 0) {
            const defaultBranchId = fetchedBranches[0].branch_id || fetchedBranches[0].company_id;
              setFormData(prev => ({ 
                ...prev, 
              branch_id: defaultBranchId.toString() 
              }));
          }
          return Promise.resolve(null);
        }
      })
      .then(response => {
        if (response && response.data) {
          const teamData = response.data;
          
          setFormData({
            name: teamData.name || '',
            branch_id: teamData.branch_id ? teamData.branch_id.toString() : '',
            description: teamData.description || ''
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

    if (!formData.branch_id) {
        setFormError('Please select a branch.');
        setLoading(false);
        return;
    }

    // Submit just the fields needed by the backend stored procedure
    const dataToSubmit = {
        name: formData.name,
        branch_id: parseInt(formData.branch_id, 10),
        description: formData.description || ''
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
                <CFormLabel htmlFor="branch_id" className="col-sm-2 col-form-label">Branch *</CFormLabel>
                <CCol sm={10}>
                  <CFormSelect
                    id="branch_id"
                    name="branch_id"
                    value={formData.branch_id}
                    onChange={handleChange}
                    required
                    aria-label="Select Branch"
                  >
                    <option value="">Select a Branch</option>
                    {branches.map(branch => (
                      <option key={branch.branch_id || branch.company_id} value={branch.branch_id || branch.company_id}>
                        {branch.name}
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
                  <CButton type="submit" color="primary" disabled={loading || !formData.branch_id} className="me-2">
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

