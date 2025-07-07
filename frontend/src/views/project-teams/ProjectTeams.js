  import React, { useState, useEffect } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CForm,
  CFormLabel,
  CFormSelect,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CSpinner,
  CAlert,
  CBadge,
  CTooltip,
  CInputGroup,
  CInputGroupText,
  CFormInput,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilTrash, cilPeople, cilPlus, cilUserPlus, cilStar } from '@coreui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getProjects,
  getTeams,
  getEmployees,
  getProjectTeamMembers,
  addProjectTeamMember,
  removeProjectTeamMember,
  getTeamsByBranch,
  getEmployeesByTeam,
  getCustomerEmployeesByProject,
} from '../../services/api';

const ProjectTeams = () => {
  const navigate = useNavigate();
  const { user, canManageProjects } = useAuth();
  
  // State variables
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTeamLeadModal, setShowTeamLeadModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [customerTeamMembers, setCustomerTeamMembers] = useState([]);
  const [loadingCustomerTeam, setLoadingCustomerTeam] = useState(false);
  
  // Fetch initial data
  useEffect(() => {
    fetchProjects();
  }, []);
  
  // Fetch project team members when project selection changes
  useEffect(() => {
    if (selectedProject) {
      fetchProjectTeamMembers();
      fetchTeams();
      fetchCustomerTeamMembers();
    } else {
      setCustomerTeamMembers([]);
    }
  }, [selectedProject]);
  
  // Fetch employees when team selection changes
  useEffect(() => {
    if (selectedTeam) {
      fetchEmployees();
    } else {
      setEmployees([]);
    }
  }, [selectedTeam]);
  
  // Fetch projects
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await getProjects();
      setProjects(response.data || []);
      
      // Select the first project by default if available
      if (response.data && response.data.length > 0) {
        setSelectedProject(response.data[0].project_id.toString());
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to fetch projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch teams
  const fetchTeams = async () => {
    try {
      const response = await getTeams();
      setTeams(response.data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('Failed to fetch teams. Please try again.');
    }
  };
  
  // Fetch employees for the selected team
  const fetchEmployees = async () => {
    try {
      if (!selectedTeam) return;
      
      const response = await getEmployeesByTeam(selectedTeam);
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to fetch employees. Please try again.');
    }
  };
  
  // Fetch project team members
  const fetchProjectTeamMembers = async () => {
    try {
      if (!selectedProject) return;
      
      setLoading(true);
      const response = await getProjectTeamMembers(selectedProject);
      setTeamMembers(response.data || []);
    } catch (error) {
      console.error('Error fetching project team members:', error);
      setError('Failed to fetch project team members. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Add team member to project
  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    
    if (!selectedProject || !selectedTeam || !selectedEmployee) {
      setError('Please select a project, team, and employee.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      const data = {
        project_id: parseInt(selectedProject),
        team_id: parseInt(selectedTeam),
        employee_id: parseInt(selectedEmployee),
        role: 'team_member', // Default role is member
      };
      
      await addProjectTeamMember(data);
      
      setSuccess('Team member added successfully.');
      setSelectedEmployee('');
      fetchProjectTeamMembers();
    } catch (error) {
      console.error('Error adding team member:', error);
      setError('Failed to add team member. ' + (error.message || ''));
    } finally {
      setSubmitting(false);
    }
  };
  
  // Remove team member from project
  const handleRemoveTeamMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this team member from the project?')) {
      return;
    }
    
    try {
      setSubmitting(true);
      await removeProjectTeamMember(memberId);
      
      setSuccess('Team member removed successfully.');
      fetchProjectTeamMembers();
    } catch (error) {
      console.error('Error removing team member:', error);
      setError('Failed to remove team member. ' + (error.message || ''));
    } finally {
      setSubmitting(false);
    }
  };
  
  // Set team lead
  const handleSetTeamLead = async (member) => {
    setSelectedMember(member);
    setShowTeamLeadModal(true);
  };
  
  // Confirm setting team lead
  const confirmSetTeamLead = async () => {
    if (!selectedMember) return;
    
    try {
      setSubmitting(true);
      
      // Update the member's role to 'team_lead'
      await addProjectTeamMember({
        project_id: parseInt(selectedProject),
        team_id: selectedMember.team_id,
        employee_id: selectedMember.employee_id,
        role: 'team_lead',
        id: selectedMember.id // Include ID for update
      });
      
      setSuccess(`${selectedMember.employee_name} has been set as team lead.`);
      setShowTeamLeadModal(false);
      fetchProjectTeamMembers();
    } catch (error) {
      console.error('Error setting team lead:', error);
      setError('Failed to set team lead. ' + (error.message || ''));
    } finally {
      setSubmitting(false);
    }
  };
  
  // Check if an employee is already in the team
  const isEmployeeInTeam = (employeeId) => {
    return teamMembers.some(member => 
      member.employee_id.toString() === employeeId.toString() && 
      member.team_id.toString() === selectedTeam.toString()
    );
  };
  
  // Get available employees (not already in the team)
  const getAvailableEmployees = () => {
    return employees.filter(employee => 
      !isEmployeeInTeam(employee.employee_id)
    );
  };
  
  // Group team members by team
  const getTeamMembersByTeam = () => {
    const teamGroups = {};
    
    teamMembers.forEach(member => {
      const teamId = member.team_id;
      if (!teamGroups[teamId]) {
        teamGroups[teamId] = {
          team_id: teamId,
          team_name: member.team_name,
          members: []
        };
      }
      teamGroups[teamId].members.push(member);
    });
    
    return Object.values(teamGroups);
  };
  
  // Fetch customer team members
  const fetchCustomerTeamMembers = async () => {
    if (!selectedProject) return;
    
    try {
      setLoadingCustomerTeam(true);
      const response = await getCustomerEmployeesByProject(selectedProject);
      setCustomerTeamMembers(response.data || []);
    } catch (error) {
      console.error('Error fetching customer team members:', error);
      setError('Failed to fetch customer team members. Please try again.');
    } finally {
      setLoadingCustomerTeam(false);
    }
  };

  // Render customer team members table
  const renderCustomerTeamTable = () => {
    if (loadingCustomerTeam) {
      return (
        <div className="text-center my-3">
          <CSpinner size="sm" />
          <div className="mt-2">Loading customer team members...</div>
        </div>
      );
    }

    if (customerTeamMembers.length === 0) {
      return (
        <CAlert color="info">
          No customer team members found for this project.
        </CAlert>
      );
    }

    return (
      <CTable hover responsive>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>Name</CTableHeaderCell>
            <CTableHeaderCell>Email</CTableHeaderCell>
            <CTableHeaderCell>Phone</CTableHeaderCell>
            <CTableHeaderCell>Role</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {customerTeamMembers.map((member) => (
            <CTableRow key={`customer-member-${member.customer_employee_id}`}>
              <CTableDataCell>
                {member.first_name} {member.last_name}
              </CTableDataCell>
              <CTableDataCell>{member.email}</CTableDataCell>
              <CTableDataCell>{member.phone || 'N/A'}</CTableDataCell>
              <CTableDataCell>
                {member.is_head ? (
                  <CBadge color="primary">Customer Head</CBadge>
                ) : (
                  <CBadge color="secondary">Customer Member</CBadge>
                )}
              </CTableDataCell>
            </CTableRow>
          ))}
        </CTableBody>
      </CTable>
    );
  };

  // Render team members table
  const renderTeamMembersTable = () => {
    const teamGroups = getTeamMembersByTeam();
    
    if (teamGroups.length === 0) {
      return (
        <CAlert color="info">
          No team members assigned to this project yet.
        </CAlert>
      );
    }
    
    return teamGroups.map((teamGroup, index) => (
      <CCard className="mb-4" key={teamGroup.team_id}>
        <CCardHeader>
          <strong>{teamGroup.team_name}</strong>
        </CCardHeader>
        <CCardBody>
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Employee</CTableHeaderCell>
                <CTableHeaderCell>Role</CTableHeaderCell>
                <CTableHeaderCell>Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {teamGroup.members.map(member => (
                <CTableRow key={member.id}>
                  <CTableDataCell>
                    {member.employee_name}
                  </CTableDataCell>
                  <CTableDataCell>
                    {member.role === 'team_lead' ? (
                      <CBadge color="success">Team Lead</CBadge>
                    ) : (
                      <CBadge color="info">Member</CBadge>
                    )}
                  </CTableDataCell>
                  <CTableDataCell>
                    <div className="d-flex gap-2">
                      {member.role !== 'team_lead' && canManageProjects && (
                        <CTooltip content="Set as Team Lead">
                          <CButton 
                            color="success" 
                            size="sm"
                            onClick={() => handleSetTeamLead(member)}
                          >
                            <CIcon icon={cilStar} />
                          </CButton>
                        </CTooltip>
                      )}
                      {canManageProjects && (
                        <CTooltip content="Remove from Project">
                          <CButton 
                            color="danger" 
                            size="sm"
                            onClick={() => handleRemoveTeamMember(member.id)}
                          >
                            <CIcon icon={cilTrash} />
                          </CButton>
                        </CTooltip>
                      )}
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    ));
  };
  
  // Main render
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <CIcon icon={cilPeople} className="me-2" />
          Project Teams
        </h2>
      </div>
      
      {error && (
        <CAlert color="danger" dismissible onClose={() => setError('')}>
          {error}
        </CAlert>
      )}
      
      {success && (
        <CAlert color="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </CAlert>
      )}
      
      <CRow>
        <CCol md={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Select Project</strong>
            </CCardHeader>
            <CCardBody>
              <CFormSelect
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                disabled={loading || submitting}
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.project_id} value={project.project_id}>
                    {project.name}
                  </option>
                ))}
              </CFormSelect>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      
      {selectedProject && canManageProjects && (
        <CRow>
          <CCol md={12}>
            <CCard className="mb-4">
              <CCardHeader>
                <strong>Add Team Member</strong>
              </CCardHeader>
              <CCardBody>
                <CForm onSubmit={handleAddTeamMember}>
                  <CRow>
                    <CCol md={5}>
                      <CFormLabel>Team</CFormLabel>
                      <CFormSelect
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        disabled={loading || submitting}
                      >
                        <option value="">Select a team</option>
                        {teams.map(team => (
                          <option key={team.team_id} value={team.team_id}>
                            {team.name}
                          </option>
                        ))}
                      </CFormSelect>
                    </CCol>
                    <CCol md={5}>
                      <CFormLabel>Employee</CFormLabel>
                      <CFormSelect
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        disabled={!selectedTeam || loading || submitting}
                      >
                        <option value="">Select an employee</option>
                        {getAvailableEmployees().map(employee => (
                          <option key={employee.employee_id} value={employee.employee_id}>
                            {`${employee.first_name} ${employee.last_name}`}
                          </option>
                        ))}
                      </CFormSelect>
                    </CCol>
                    <CCol md={2} className="d-flex align-items-end">
                      <CButton 
                        type="submit" 
                        color="primary"
                        disabled={!selectedTeam || !selectedEmployee || loading || submitting}
                      >
                        {submitting ? (
                          <CSpinner size="sm" />
                        ) : (
                          <>
                            <CIcon icon={cilUserPlus} className="me-2" />
                            Add Member
                          </>
                        )}
                      </CButton>
                    </CCol>
                  </CRow>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}
      
      {selectedProject && (
        <>
          <CRow className="mt-4">
            <CCol md={12}>
              <h4 className="mb-3">Internal Team Members</h4>
              {loading ? (
                <div className="text-center my-5">
                  <CSpinner />
                  <div className="mt-2">Loading team members...</div>
                </div>
              ) : (
                renderTeamMembersTable()
              )}
            </CCol>
          </CRow>
          
          <CRow className="mt-5">
            <CCol md={12}>
              <h4 className="mb-3">Customer Team</h4>
              <CCard>
                <CCardBody>
                  {renderCustomerTeamTable()}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </>
      )}
      
      {/* Team Lead Modal */}
      <CModal visible={showTeamLeadModal} onClose={() => setShowTeamLeadModal(false)}>
        <CModalHeader>
          <CModalTitle>Confirm Team Lead Assignment</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedMember && (
            <p>
              Are you sure you want to set <strong>{selectedMember.employee_name}</strong> as the Team Lead for <strong>{selectedMember.team_name}</strong> in this project?
            </p>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowTeamLeadModal(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={confirmSetTeamLead} disabled={submitting}>
            {submitting ? <CSpinner size="sm" /> : 'Confirm'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default ProjectTeams; 