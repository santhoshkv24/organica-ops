import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CCard, 
  CCardBody, 
  CSpinner, 
  CButton, 
  CModal, 
  CModalHeader, 
  CModalTitle, 
  CModalBody, 
  CModalFooter,
  CFormSelect,
  CAlert,
  CBadge,
  CTooltip
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { 
  cilGroup, 
  cilBriefcase, 
  cilBuilding, 
  cilPeople, 
  cilUserPlus, 
  cilUserX,
  cilUserFollow,
  cilCheck,
  cilChevronRight
} from '@coreui/icons';
import FormGrid from '../../components/FormGrid';
import { 
  getTeams, 
  createTeam, 
  updateTeam, 
  deleteTeam, 
  getCompanies, 
  getTeamLeads, 
  assignTeamLead, 
  removeTeamLead,
  getTeamMembers,
  getTeamLeadStatus
} from '../../services/api';
import Button from '@mui/material/Button';
import { validateForm, validationSchemas } from '../../utils/formValidation';
import { useAuth } from '../../contexts/AuthContext';

const Teams = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [teams, setTeams] = useState([]);
  const [teamLeads, setTeamLeads] = useState({});
  const [teamMembers, setTeamMembers] = useState({});
  const [modal, setModal] = useState({
    show: false,
    mode: 'select', // 'select', 'assign', 'remove'
    team: null,
    employee: null,
    loading: false,
    error: null,
    success: null
  });
  
  // Helper to set error in modal state
  const setModalError = (error) => {
    setModal(prev => ({ ...prev, error, loading: false }));
  };
  
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedMember, setSelectedMember] = useState('');
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setErrorState] = useState(null);
  
  const isAdmin = user && (user.role === 'admin' || user.role === 'manager');

  // Fetch branches for dropdown
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await getCompanies(); // Using existing endpoint as it was renamed on the backend
        setBranches(response.data.data || response.data);
      } catch (err) {
        console.error("Failed to fetch branches:", err);
      }
    };
    
    fetchBranches();
  }, []);

  // Define form fields for team management
  const formFields = [
    {
      name: 'name',
      label: 'Team Name',
      type: 'text',
      required: true,
      placeholder: 'Enter team name',
      tooltip: 'The name of the team',
      colSpan: 2
    },
    {
      name: 'branch_id',
      label: 'Branch',
      type: 'select',
      required: true,
      placeholder: 'Select branch',
      tooltip: 'The branch this team belongs to',
      options: branches.map(branch => ({
        value: branch.branch_id || branch.company_id, // Handle both formats
        label: branch.name
      }))
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter team description',
      tooltip: 'Brief description of the team and its purpose',
      rows: 3,
      colSpan: 2
    }
  ];

  // Handle opening the assign team lead modal
  const handleOpenAssignLead = (team) => {
    setSelectedTeam(team);
    setSelectedMember('');
    
    setModal({
      show: true,
      title: `Assign Team Lead - ${team.name}`,
      size: 'lg',
      onClose: () => setModal({ ...modal, show: false }),
      content: (
        <>
          <div className="mb-3">
            <label className="form-label">Select Team Member</label>
            <CFormSelect 
              value={selectedMember} 
              onChange={(e) => setSelectedMember(e.target.value)}
              disabled={processing}
            >
              <option value="">-- Select a team member --</option>
              {teamMembers[team.team_id]?.map(member => (
                <option key={member.employee_id} value={member.employee_id}>
                  {member.first_name} {member.last_name}
                  {member.is_team_lead && ' (Current Lead)'}
                </option>
              ))}
            </CFormSelect>
          </div>
          
          <div className="mb-3">
            <h6>Current Team Leads:</h6>
            {teamLeads[team.team_id]?.length > 0 ? (
              <div className="d-flex flex-wrap gap-2">
                {teamLeads[team.team_id].map(lead => (
                  <CBadge 
                    key={lead.team_lead_id}
                    color="success" 
                    className="d-inline-flex align-items-center gap-1 me-2 mb-2"
                  >
                    <CIcon icon={cilUserFollow} className="me-1" />
                    {lead.employee_name}
                    <CButton 
                      color="light" 
                      size="sm" 
                      className="ms-2 p-0"
                      onClick={() => handleRemoveLead(lead.team_lead_id, team.team_id)}
                      disabled={processing}
                    >
                      <CIcon icon={cilUserX} className="text-danger" />
                    </CButton>
                  </CBadge>
                ))}
              </div>
            ) : (
              <p className="text-muted">No team leads assigned yet.</p>
            )}
          </div>
        </>
      )
    });
  };

  // Handle assigning a team lead
  const handleAssignLead = async () => {
    if (!modal.employee) {
      setModalError('Please select a team member');
      return;
    }

    try {
      setModal(prev => ({ ...prev, loading: true, error: null }));
      
      // Call the API to assign team lead
      const response = await assignTeamLead(modal.team.team_id, modal.employee.employee_id);
      
      if (response.success) {
        // Refresh team leads and get updated user role
        const [leads, leadStatus] = await Promise.all([
          getTeamLeads(modal.team.team_id),
          getTeamLeadStatus(modal.employee.employee_id)
        ]);
        
        // Update state with new team leads
        setTeamLeads(prev => ({
          ...prev,
          [modal.team.team_id]: leads.data || []
        }));
      
        // Update teams to reflect the new leads
        setTeams(prevTeams =>
          prevTeams.map(team => 
            team.team_id === modal.team.team_id
              ? { 
                  ...team,
                  team_lead_name: leads.data?.length > 0 
                    ? leads.data.map(lead => lead.employee_name).join(', ')
                    : ''
                }
              : team
          )
        );

        // Show success message with role update info
        const successMessage = leadStatus.data?.is_team_lead
          ? `Successfully assigned ${modal.employee.first_name} as team lead. Their role has been updated to Team Lead.`
          : `Successfully assigned ${modal.employee.first_name} as team lead.`;
      
        setModal(prev => ({
          ...prev,
          loading: false,
          success: successMessage,
          error: null
        }));
        
        // Close modal and reset after delay
        setTimeout(() => {
          setModal({
            show: false,
            mode: 'select',
            team: null,
            employee: null,
            loading: false,
            error: null,
            success: null
          });
          
          // Refresh data
          fetchTeamLeads(modal.team.team_id);
          fetchTeams(); // Refresh the entire teams list to show updated roles
        }, 2000);
      } else {
        throw new Error(response.message || 'Failed to assign team lead');
      }
    } catch (err) {
      console.error('Error assigning team lead:', err);
      setModal(prev => ({
        ...prev,
        loading: false,
        error: err.response?.data?.message || err.message || 'Failed to assign team lead'
      }));
    } finally {
      setProcessing(false);
    }
  };

  // Handle removing a team lead
  const handleRemoveLead = async () => {
    if (!modal.employee) {
      setModalError('Please select a team lead to remove');
      return;
    }

    try {
      setModal(prev => ({ ...prev, loading: true, error: null }));
      
      // Find the team lead ID to remove
      const teamLead = teamLeads[modal.team.team_id]?.find(
        lead => lead.employee_id === modal.employee.employee_id
      );
      
      if (!teamLead) {
        throw new Error('Selected team lead not found');
      }
      
      // Get current lead status before removal
      const leadStatus = await getTeamLeadStatus(modal.employee.employee_id);
      
      // Call the API to remove team lead
      const response = await removeTeamLead(teamLead.team_lead_id);
      
      if (response.success) {
        // Refresh team leads and get updated user role
        const [leads, updatedStatus] = await Promise.all([
          getTeamLeads(modal.team.team_id),
          getTeamLeadStatus(modal.employee.employee_id)
        ]);
        
        // Update state
        setTeamLeads(prev => ({
          ...prev,
          [modal.team.team_id]: leads.data || []
        }));
      
        // Update teams to reflect the removed lead
        setTeams(prevTeams =>
          prevTeams.map(team => 
            team.team_id === modal.team.team_id
              ? { 
                  ...team,
                  team_lead_name: leads.data?.length > 0 
                    ? leads.data.map(lead => lead.employee_name).join(', ')
                   : ''
                }
              : team
          )
        );

        // Prepare success message based on role change
        let successMessage = `Successfully removed ${modal.employee.first_name} as team lead.`;
        
        if (leadStatus.data?.is_team_lead && !updatedStatus.data?.is_team_lead) {
          successMessage += ' Their role has been reverted to Employee.';
        }
      
        // Show success message and reset modal
        setModal(prev => ({
          ...prev,
          loading: false,
          success: successMessage,
          error: null
        }));
        
        // Close modal and reset after delay
        setTimeout(() => {
          setModal({
            show: false,
            mode: 'select',
            team: null,
            employee: null,
            loading: false,
            error: null,
            success: null
          });
          
          // Refresh data
          fetchTeamLeads(modal.team.team_id);
          fetchTeams(); // Refresh the entire teams list to show updated roles
        }, 2000);
      } else {
        throw new Error(response.message || 'Failed to remove team lead');
      }
    } catch (err) {
      console.error('Error removing team lead:', err);
      setModal(prev => ({
        ...prev,
        loading: false,
        error: err.response?.data?.message || err.message || 'Failed to remove team lead'
      }));
    } finally {
      setProcessing(false);
    }
  };

  // Get a team by ID
  const getTeamById = async (teamId) => {
    try {
      const response = await getTeamById(teamId);
      return response.data;
    } catch (err) {
      console.error(`Failed to fetch team ${teamId}:`, err);
      return null;
    }
  };

  // Define grid columns for teams list
  const gridColumns = [
    { 
      key: 'name', 
      label: 'Team Name',
      sortable: true,
      render: (value, row) => (
        <div className="d-flex align-items-center">
          <div className="bg-light p-2 rounded-circle me-3">
            <CIcon icon={cilGroup} size="lg" />
          </div>
          <div className="fw-bold">{value}</div>
        </div>
      )
    },
    {
      key: 'team_leads',
      label: 'Team Lead',
      sortable: false,
      render: (_, row) => (
        <div className="d-flex flex-wrap gap-1">
          {teamLeads[row.team_id]?.length > 0 ? (
            teamLeads[row.team_id]?.map(lead => (
              <CBadge 
                key={lead.team_lead_id} 
                color="success" 
                className="d-inline-flex align-items-center"
              >
                <CIcon icon={cilUserFollow} className="me-1" />
                {lead.employee_name}
              </CBadge>
            ))
          ) : (
            <span className="text-muted">No lead assigned</span>
          )}
        </div>
      )
    },
    { 
      key: 'branch_name',
      label: 'Branch', 
      sortable: true,
      render: (value) => (
        <div className="d-flex align-items-center">
          <CIcon icon={cilBuilding} className="me-2 text-muted" size="sm" />
          {value || 'N/A'}
        </div>
      )
    },
    { 
      key: 'employee_count', 
      label: 'Members',
      sortable: true,
      render: (value) => (
        <div className="d-flex align-items-center">
          <CIcon icon={cilPeople} className="me-2 text-muted" size="sm" />
          {value || 0}
        </div>
      )
    }
  ];

  // Fetch team members for a specific team
  const fetchTeamMembers = async (teamId) => {
    try {
      const response = await getTeamMembers(teamId);
      if (response.success) {
        setTeamMembers(prev => ({
          ...prev,
          [teamId]: response.data || []
        }));
        return response.data || [];
      } else {
        throw new Error(response.message || 'Failed to fetch team members');
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      setModalError(error.message || 'Failed to load team members');
      return [];
    }
  };

  // Fetch team leads for a specific team
  const fetchTeamLeads = useCallback(async (teamId) => {
    try {
      const response = await getTeamLeads(teamId);
      if (response.success) {
        setTeamLeads(prev => ({
          ...prev,
          [teamId]: response.data || []
        }));
        return response.data || [];
      } else {
        throw new Error(response.message || 'Failed to fetch team leads');
      }
    } catch (error) {
      console.error('Error fetching team leads:', error);
      setModalError(error.message || 'Failed to load team leads');
      return [];
    }
  }, []);

  // Fetch teams from API
  const fetchTeams = async (searchParams = {}) => {
    try {
      setLoading(true);
      setErrorState(null);

      // Build query params from search fields
      const queryParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await getTeams(queryParams.toString());
      const teamsData = response.data.data || response.data;
      setTeams(teamsData);

      // Pre-fetch team members and leads for each team
      const membersData = {};
      const leadsData = {};
      
      await Promise.all(teamsData.map(async (team) => {
        const [members, leads] = await Promise.all([
          fetchTeamMembers(team.team_id),
          fetchTeamLeads(team.team_id)
        ]);
        membersData[team.team_id] = members;
        leadsData[team.team_id] = leads;
      }));

      setTeamMembers(membersData);
      setTeamLeads(leadsData);
    } catch (err) {
      console.error("Failed to fetch teams:", err);
      setErrorState("Failed to load teams. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // Handle creating a new team
  const handleCreateTeam = async (values) => {
    try {
      // Make sure we only submit the fields the backend expects
      const teamData = {
        name: values.name,
        branch_id: values.branch_id,
        description: values.description || ''
      };
      
      await createTeam(teamData);
      await fetchTeams();
      return true;
    } catch (error) {
      console.error("Error creating team:", error);
      throw new Error(error.message || "Failed to create team");
    }
  };

  // Handle updating a team
  const handleUpdateTeam = async (team, values) => {
      try {
      // Make sure we only submit the fields the backend expects
      const teamData = {
        name: values.name,
        branch_id: values.branch_id,
        description: values.description || ''
      };
      
      await updateTeam(team.team_id, teamData);
      await fetchTeams();
      return true;
    } catch (error) {
      console.error("Error updating team:", error);
      throw new Error(error.message || "Failed to update team");
    }
  };

  // Handle deleting a team
  const handleDeleteTeam = async (team) => {
    try {
      await deleteTeam(team.team_id);
      await fetchTeams();
      return true;
    } catch (error) {
      console.error("Error deleting team:", error);
      throw new Error(error.message || "Failed to delete team");
    }
  };

  // Form validation
  const validateTeamForm = (values) => {
    // Create a temporary schema with only the fields we need
    const teamSchema = {
      name: validationSchemas.team.name,
      branch_id: {
        label: 'Branch',
        required: true
      },
      description: validationSchemas.team.description
    };
    
    return validateForm(values, teamSchema);
  };

  // Show loading spinner while data is loading
  if (loading && !teams.length) {
  return (
        <CCard className="mb-4">
        <CCardBody className="text-center p-5">
          <CSpinner color="primary" />
          <div className="mt-3">Loading teams...</div>
          </CCardBody>
        </CCard>
    );
  }

  // State for team leads management is already defined above

  // Handle opening the team selection modal
  const handleOpenTeamLeadsModal = () => {
    setModal({
      show: true,
      mode: 'select',
      team: null,
      employee: null,
      loading: false,
      error: null,
      success: null
    });
  };

  // Handle team selection
  const handleSelectTeam = (team) => {
    setModal(prev => ({
      ...prev,
      mode: 'select-action',
      team: team,
      error: null,
      success: null
    }));
  };

  // Handle action selection (assign or remove)
  const handleSelectAction = (action) => {
    setModal(prev => ({
      ...prev,
      mode: action,
      employee: null, // Reset selected employee when switching actions
      error: null,
      success: null
    }));
  };

  // Render top controls with Manage Team Leads button
  const renderTopControls = () => (
    <>
      {isAdmin && (
        <Button 
          variant="contained" 
          sx={{ backgroundColor: 'black', color: 'white', textTransform: 'none'}} 
          color="secondary" 
          onClick={handleOpenTeamLeadsModal}
          className="me-2"
          disabled={processing}
        >
          <CIcon icon={cilPeople} className="me-1" />
          Manage Team Leads
        </Button>
      )}
    </>
  );

  return (
    <>
      <FormGrid
        title="Teams"
        data={teams}
        columns={gridColumns}
        formFields={formFields}
        formTitle="Team Information"
        loading={loading}
        onFetchData={fetchTeams}
        onCreate={handleCreateTeam}
        onUpdate={handleUpdateTeam}
        onDelete={handleDeleteTeam}
        validateForm={validateTeamForm}
        enableCreate={isAdmin}
        enableEdit={isAdmin}
        enableDelete={isAdmin}
        formPosition="modal"
        showSearchForm={true}
        confirmDelete={true}
        deleteMessage="Are you sure you want to delete this team? This action cannot be undone and will also affect all employees associated with this team."
        renderTopControls={renderTopControls}
      />

      {/* Team Lead Management Modal */}
      <CModal 
        visible={modal.show} 
        onClose={() => !processing && setModal({ ...modal, show: false })}
        size="lg"
      >
        <CModalHeader onClose={() => !processing && setModal({ ...modal, show: false })}>
          <CModalTitle>
            {modal.mode === 'select' ? 'Select Team' : 
             modal.mode === 'select-action' ? 'Manage Team Leads' :
             modal.mode === 'assign' ? 'Assign Team Lead' : 'Remove Team Lead'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {modal.error && <CAlert color="danger">{modal.error}</CAlert>}
          {modal.success && <CAlert color="success">{modal.success}</CAlert>}
          
          {modal.loading ? (
            <div className="text-center p-4">
              <CSpinner />
              <div className="mt-2">Processing...</div>
            </div>
          ) : modal.mode === 'select' ? (
            <div className="team-selection">
              <h5>Select a team to manage leads:</h5>
              <div className="list-group mt-3">
                {teams.map(team => (
                  <button
                    key={team.team_id}
                    type="button"
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                    onClick={() => handleSelectTeam(team)}
                  >
                    <div>
                      <strong>{team.name}</strong>
                      <div className="text-muted small">
                        {team.employee_count} members • {team.branch_name || 'No branch'}
                      </div>
                    </div>
                    <CIcon icon={cilChevronRight} />
                  </button>
                ))}
              </div>
            </div>
          ) : modal.mode === 'select-action' ? (
            <div className="action-selection">
              <h5>Select an action for {modal.team?.name}:</h5>
              <div className="d-grid gap-3 mt-4">
                <CButton 
                  color="primary" 
                  className="py-3"
                  onClick={() => handleSelectAction('assign')}
                >
                  <CIcon icon={cilUserPlus} className="me-2" />
                  Assign New Team Lead
                </CButton>
                <CButton 
                  color="danger" 
                  variant="outline" 
                  className="py-3"
                  onClick={() => handleSelectAction('remove')}
                  disabled={!teamLeads[modal.team?.team_id]?.length}
                >
                  <CIcon icon={cilUserX} className="me-2" />
                  Remove Existing Team Lead
                  {!teamLeads[modal.team?.team_id]?.length && (
                    <small className="d-block mt-1 text-muted">(No team leads to remove)</small>
                  )}
                </CButton>
              </div>
            </div>
          ) : modal.mode === 'assign' ? (
            <div>
              <h5>Assign Team Lead for {modal.team?.name || 'Selected Team'}</h5>
              <div className="mt-3">
                <CFormSelect
                  value={modal.employee?.employee_id || ''}
                  onChange={(e) => {
                    const employeeId = parseInt(e.target.value);
                    const employee = teamMembers[modal.team?.team_id]?.find(
                      (emp) => emp.employee_id === employeeId
                    );
                    setModal(prev => ({ ...prev, employee }));
                  }}
                  disabled={!teamMembers[modal.team?.team_id]?.length}
                >
                  <option value="">Select an employee</option>
                  {teamMembers[modal.team?.team_id]?.map((employee) => (
                    <option key={employee.employee_id} value={employee.employee_id}>
                      {employee.first_name} {employee.last_name} ({employee.email})
                    </option>
                  ))}
                </CFormSelect>
                {!teamMembers[modal.team?.team_id]?.length && (
                  <div className="text-muted mt-2">
                    No team members found. Please add members to this team first.
                  </div>
                )}
              </div>
            </div>
          ) : modal.mode === 'remove' ? (
            <div>
              <h5>Remove Team Lead from {modal.team?.name || 'Selected Team'}</h5>
              <div className="mt-3">
                <CFormSelect
                  value={modal.employee?.employee_id || ''}
                  onChange={(e) => {
                    const employeeId = parseInt(e.target.value);
                    const employee = teamLeads[modal.team?.team_id]?.find(
                      (lead) => lead.employee_id === employeeId
                    );
                    setModal(prev => ({ ...prev, employee }));
                  }}
                  disabled={!teamLeads[modal.team?.team_id]?.length}
                >
                  <option value="">Select a team lead to remove</option>
                  {teamLeads[modal.team?.team_id]?.map((lead) => (
                    <option key={lead.employee_id} value={lead.employee_id}>
                      {lead.employee_name} ({lead.email})
                    </option>
                  ))}
                </CFormSelect>
                {!teamLeads[modal.team?.team_id]?.length && (
                  <div className="text-muted mt-2">
                    No team leads found for this team.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center p-4">
              <div className="text-muted">Invalid modal state. Please try again.</div>
              <CButton 
                color="primary" 
                className="mt-3"
                onClick={() => setModal({ ...modal, show: false })}
              >
                Close
              </CButton>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton 
            color="secondary" 
            onClick={() => {
              if (modal.mode === 'select') {
                setModal({ ...modal, show: false });
              } else {
                setModal({ ...modal, mode: 'select' });
              }
            }}
            disabled={modal.loading}
          >
            {modal.mode === 'select' ? 'Close' : 'Back'}
          </CButton>
          
          {modal.mode === 'assign' && (
            <CButton 
              color="primary" 
              onClick={() => modal.team && modal.employee && handleAssignLead(modal.team, modal.employee)}
              disabled={!modal.employee || !modal.team || modal.loading}
            >
              {modal.loading ? 'Assigning...' : 'Assign Lead'}
            </CButton>
          )}
          
          {modal.mode === 'remove' && (
            <CButton 
              color="danger" 
              onClick={handleRemoveLead}
              disabled={!modal.employee || modal.loading}
            >
              {modal.loading ? 'Removing...' : 'Remove Lead'}
            </CButton>
          )}
        </CModalFooter>
      </CModal>
    </>
  );
};

export default Teams;

