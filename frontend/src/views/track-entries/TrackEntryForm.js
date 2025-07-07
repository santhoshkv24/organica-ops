import React, { useState, useEffect } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CSpinner,
  CAlert,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
} from '@coreui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getProjects,
  getTeams,
  getAssignableEmployees,
  getTrackEntry,
  createTrackEntry,
  updateTrackEntry,
  getProjectsByManager,
  getTeamLeadStatus,
  getProjectTeamMembers,
  getCustomerEmployeesByProject,
  getMyProjectTeams,
  getMyCustomerTeams,
  createCustomerTrackEntry,
  updateCustomerTrackEntry,
  getCustomerTrackEntry,
  getEmployeesByTeam,
  getProjectByCustomerHeadId,
} from '../../services/api';

const TrackEntryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    user, 
    isAdmin, 
    isProjectManager, 
    isTeamLead, 
    isCustomerTeamsHead, 
    isCustomerTeamMember 
  } = useAuth();
  
  const isEdit = !!id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [managedTeams, setManagedTeams] = useState([]);
  const [projectTeamMembers, setProjectTeamMembers] = useState([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('internal'); // 'internal' or 'customer'
  
  const [formData, setFormData] = useState({
    project_id: '',
    team_id: '',
    assigned_to: '',
    title: '',
    description: '',
    task_type: 'Task',
    priority: 'Medium',
    status: 'To Do',
    due_date: '',
    hours_spent: '0',
    is_customer_task: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchFormOptions();

        if (isEdit) {
          await fetchEntryDetails();
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        setError('Failed to load form data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isEdit, id]);

  useEffect(() => {
    if (formData.project_id && !formData.is_customer_task) {
      fetchAssignableEmployees(formData.project_id, formData.team_id);
    }
  }, [formData.project_id, formData.team_id, formData.is_customer_task]);

  // Set active tab based on task type and user role
  useEffect(() => {
    // For customer team heads, always use customer tab
    if (isCustomerTeamsHead) {
      setActiveTab('customer');
      setFormData(prev => ({ ...prev, is_customer_task: true }));
    } else if (formData.is_customer_task) {
      setActiveTab('customer');
    } else {
      setActiveTab('internal');
    }
  }, [formData.is_customer_task, isCustomerTeamsHead]);

  // Auto-set team_id for team leads when project changes
  useEffect(() => {
    if (isTeamLead && formData.project_id && !formData.team_id && managedTeams.length > 0) {
      // Find the team for this project
      const teamForProject = managedTeams.find(team => 
        team.projects?.some(project => project.project_id.toString() === formData.project_id.toString())
      );
      
      if (teamForProject) {
        console.log(`Auto-setting team_id to ${teamForProject.team_id} for team lead`);
        
        // Update form data with the found team
        setFormData(prev => ({
          ...prev,
          team_id: teamForProject.team_id.toString()
        }));
      } else if (managedTeams.length === 1) {
        // If there's only one managed team and we couldn't find a match, use that team
        console.log(`Using default managed team ${managedTeams[0].team_id}`);
        
        setFormData(prev => ({
          ...prev,
          team_id: managedTeams[0].team_id.toString()
        }));
      }
    }
  }, [formData.project_id, isTeamLead, managedTeams]);

  const fetchFormOptions = async () => {
    try {
      // Different data fetching based on user role
      if (isAdmin) {
        // Admins can see all projects
        const projectsRes = await getProjects();
        setProjects(projectsRes.data || []);
      } else if (isCustomerTeamsHead) {
        // Get project for customer head
        const projectRes = await getProjectByCustomerHeadId(user.user_id);
        
        if (projectRes.success && projectRes.data) {
          const project = projectRes.data;
          setProjects([project]);
          
          // Set the project ID in form data
          setFormData(prev => ({
            ...prev,
            project_id: project.project_id.toString()
          }));
          
          // Fetch customer team members for this project
          await fetchCustomerTeamMembers(project.project_id);
        }
      } else if (isProjectManager) {
        // Project managers can only see projects they manage
        const projectsRes = await getProjectsByManager(user.employee_id);
        setProjects(projectsRes.data || []);
      } else if (isTeamLead) {
        // Get teams that the user leads
        const teamLeadRes = await getTeamLeadStatus(user.employee_id);
        console.log('Team lead status response:', teamLeadRes);
        
        if (teamLeadRes && teamLeadRes.success && teamLeadRes.data) {
          const managedTeamsData = teamLeadRes.data.teams || [];
          setManagedTeams(managedTeamsData);
          
          console.log('Managed teams data:', managedTeamsData);
          
          // Extract unique projects from the managed teams
          const teamProjects = [];
          managedTeamsData.forEach(team => {
            if (team.projects && Array.isArray(team.projects)) {
              team.projects.forEach(project => {
                if (!teamProjects.some(p => p.project_id === project.project_id)) {
                  teamProjects.push({
                    project_id: project.project_id,
                    name: project.name,
                    description: project.description,
                    status: project.status,
                    start_date: project.start_date,
                    end_date: project.end_date
                  });
                }
              });
            }
          });
          
          console.log('Team projects extracted:', teamProjects);
          setProjects(teamProjects);
        } else {
          console.warn('No team lead data found or invalid response');
          setManagedTeams([]);
          setProjects([]);
        }
      } else if (isCustomerTeamsHead) {
        // Customer Teams Head can only see projects they're assigned to
        const myProjectsRes = await getMyCustomerTeams();
        setProjects(myProjectsRes.data || []);
      }

      // Get teams (will be filtered based on project selection later)
      const teamsRes = await getTeams();
      setTeams(teamsRes.data || []);
      
    } catch (error) {
      console.error('Error fetching form options:', error);
      setError('Failed to load form options. Please try again.');
    }
  };

  const fetchEntryDetails = async () => {
    try {
      // First, try to get it as a regular track entry
      let response;
      let isCustomerEntry = false;
      
      try {
        response = await getTrackEntry(id);
        if (!response.data) {
          // If not found as regular track entry, try as customer track entry
          isCustomerEntry = true;
          response = await getCustomerTrackEntry(id);
        }
      } catch (error) {
        // If first attempt fails, try as customer track entry
        isCustomerEntry = true;
        response = await getCustomerTrackEntry(id);
      }
      
      if (!response.data) {
        throw new Error('Failed to load task details. No data returned.');
      }
      
      const entry = response.data;

      setFormData({
        project_id: entry.project_id?.toString() || '',
        team_id: entry.team_id?.toString() || '',
        assigned_to: entry.assigned_to?.toString() || '',
        title: entry.title || '',
        description: entry.description || '',
        task_type: entry.task_type || 'Task',
        priority: entry.priority || 'Medium',
        status: entry.status || 'To Do',
        due_date: entry.due_date ? new Date(entry.due_date).toISOString().split('T')[0] : '',
        hours_spent: (entry.hours_spent || '0').toString(),
        is_customer_task: isCustomerEntry,
      });

      // Fetch project teams if needed
      if (entry.project_id) {
        await fetchProjectTeamMembers(entry.project_id);
      }

      // Fetch assignable employees for the selected project and team
      if (isCustomerEntry) {
        await fetchCustomerTeamMembers(entry.project_id);
      } else {
        await fetchAssignableEmployees(entry.project_id, entry.team_id);
      }
    } catch (error) {
      console.error('Error fetching track entry:', error);
      setError('Failed to load task details. ' + (error.message || ''));
      navigate('/track-entries');
    }
  };

  const fetchProjectTeamMembers = async (projectId) => {
    if (!projectId) return;
    
    try {
      const response = await getProjectTeamMembers(projectId);
      setProjectTeamMembers(response.data || []);
    } catch (error) {
      console.error('Error fetching project team members:', error);
    }
  };

  const fetchCustomerTeamMembers = async (projectId) => {
    if (!projectId) return;
    
    try {
      // Get customer employees for this project
      const response = await getCustomerEmployeesByProject(projectId);
      
      if (response.success) {
        setCustomers(response.data || []);
      } else {
        console.error('Failed to fetch customer team members:', response.message);
        setError(response.message || 'Failed to load team members');
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customer team members:', error);
      setError('Failed to load customer team members. ' + (error.message || 'Please try again later.'));
      setCustomers([]);
    }
  };

  const fetchAssignableEmployees = async (projectId, teamId) => {
    if (!projectId) return;

    try {
      console.log(`Fetching assignable employees for project ${projectId}, team ${teamId || 'any'}`);
      
      // For team leads, we want to fetch employees from their team directly
      if (isTeamLead) {
        console.log('User is team lead, finding managed team for project');
        
        // Better logging for debugging
        console.log('Managed teams data:', JSON.stringify(managedTeams, null, 2));
        
        // Find the team for this project that the team lead manages
        let teamForProject = null;
        
        // Iterate through each managed team
        for (const team of managedTeams) {
          console.log(`Checking team ${team.team_id} for project ${projectId}`);
          
          // Check if this team has the current project
          if (team.projects && Array.isArray(team.projects)) {
            const matchingProject = team.projects.find(
              project => project.project_id.toString() === projectId.toString()
            );
            
            if (matchingProject) {
              console.log(`Found project ${projectId} in team ${team.team_id}`);
              teamForProject = team;
              break;
            }
          }
        }
        
        console.log('Team for project found:', teamForProject);
        
        if (teamForProject) {
          // Use the getAssignableEmployees endpoint which now correctly handles team leads
          console.log(`Fetching employees for team lead's team: ${teamForProject.team_id}`);
          const response = await getAssignableEmployees({
            project_id: projectId,
            team_id: teamForProject.team_id
          });
          
          console.log('Assignable employees response:', response);
          
          if (response && response.success && response.data) {
            setEmployees(response.data);
            console.log('Employees set:', response.data);
          } else {
            setEmployees([]);
            console.log('No employees found or invalid response, setting empty array');
          }
        } else {
          console.log('No team found for this project that the team lead manages');
          // Fallback: Get employees from the team lead's teams directly
          if (managedTeams.length > 0) {
            const firstTeam = managedTeams[0];
            console.log(`Fallback: Using first managed team: ${firstTeam.team_id}`);
            
            const response = await getEmployeesByTeam(firstTeam.team_id);
            if (response && response.success && response.data) {
              setEmployees(response.data);
              console.log('Fallback employees set:', response.data);
            } else {
              setEmployees([]);
              console.log('No fallback employees found, setting empty array');
            }
          } else {
            setEmployees([]);
          }
        }
      } else {
        // For admins and project managers
        console.log(`User is ${isAdmin ? 'admin' : isProjectManager ? 'project manager' : 'other role'}`);
        console.log(`Fetching assignable employees with project_id=${projectId}, team_id=${teamId || 'null'}`);
        
        const response = await getAssignableEmployees({
          project_id: projectId,
          team_id: teamId || null,
        });
        
        console.log('Assignable employees response:', response);
        
        if (response && response.success && response.data) {
          setEmployees(response.data);
          console.log('Employees set:', response.data);
        } else {
          setEmployees([]);
          console.log('No employees found or invalid response, setting empty array');
        }
      }
    } catch (error) {
      console.error('Error fetching assignable employees:', error);
      setError('Failed to load assignable employees.');
      setEmployees([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // If project changes, update teams and employees
    if (name === 'project_id') {
      if (value !== formData.project_id) {
        setFormData((prev) => ({
          ...prev,
          team_id: '',
          assigned_to: '',
        }));
        
        // Fetch team members for this project
        fetchProjectTeamMembers(value);
        
        // If it's a customer task, fetch customer team members
        if (activeTab === 'customer') {
          fetchCustomerTeamMembers(value);
        }
      }
    }
    
    // If team changes, update employees
    if (name === 'team_id') {
      if (value !== formData.team_id) {
        setFormData((prev) => ({
          ...prev,
          assigned_to: '',
        }));
      }
    }
    
    // Handle tab change via is_customer_task checkbox
    if (name === 'is_customer_task') {
      const isCustomerTask = value === 'true';
      
      setFormData((prev) => ({
        ...prev,
        is_customer_task: isCustomerTask,
        assigned_to: '',  // Clear assignee selection
      }));
      
      // Fetch appropriate assignees based on task type
      if (isCustomerTask && formData.project_id) {
        fetchCustomerTeamMembers(formData.project_id);
      } else if (formData.project_id) {
        fetchAssignableEmployees(formData.project_id, formData.team_id);
      }
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Update form data based on tab
    setFormData({
      ...formData,
      is_customer_task: tab === 'customer',
      assigned_to: '',  // Clear assignee selection
    });
    
    // Fetch appropriate assignees based on tab
    if (tab === 'customer' && formData.project_id) {
      fetchCustomerTeamMembers(formData.project_id);
    } else if (formData.project_id) {
      fetchAssignableEmployees(formData.project_id, formData.team_id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError('');
      
      // Validate form
      if (!formData.project_id) {
        setError('Please select a project.');
        setSubmitting(false);
        return;
      }
      
      if (!formData.title) {
        setError('Please enter a task title.');
        setSubmitting(false);
        return;
      }
      
      if (!formData.assigned_to) {
        setError('Please select an assignee.');
        setSubmitting(false);
        return;
      }

      // For team leads, automatically set the team_id if not already set
      let team_id = formData.team_id;
      if (isTeamLead && !team_id && managedTeams.length > 0) {
        // Find the team for this project
        const teamForProject = managedTeams.find(team => 
          team.projects?.some(project => project.project_id.toString() === formData.project_id.toString())
        );
        
        if (teamForProject) {
          console.log(`Auto-setting team_id to ${teamForProject.team_id} for team lead`);
          team_id = teamForProject.team_id.toString();
        } else if (managedTeams.length === 1) {
          // If there's only one managed team and we couldn't find a match, use that team
          console.log(`Using default managed team ${managedTeams[0].team_id}`);
          team_id = managedTeams[0].team_id.toString();
        }
      }
      
      // Check if team_id is set
      if (!team_id && !formData.is_customer_task) {
        setError('Team ID is required. Please select a team or contact support.');
        setSubmitting(false);
        return;
      }
      
      // Prepare data for submission
      const submitData = {
        ...formData,
        project_id: parseInt(formData.project_id),
        team_id: team_id ? parseInt(team_id) : null,
        assigned_to: parseInt(formData.assigned_to),
        hours_spent: parseFloat(formData.hours_spent) || 0,
      };
      
      console.log('Submitting form data:', submitData);
      
      let response;
      if (formData.is_customer_task) {
        if (isEdit) {
          response = await updateCustomerTrackEntry(id, submitData);
        } else {
          response = await createCustomerTrackEntry(submitData);
        }
      } else {
        if (isEdit) {
          response = await updateTrackEntry(id, submitData);
        } else {
          response = await createTrackEntry(submitData);
        }
      }
      
      // Navigate back to track entries list
      navigate('/track-entries');
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Failed to save task. ' + (error.message || ''));
    } finally {
      setSubmitting(false);
    }
  };

  const getFilteredTeams = () => {
    if (!formData.project_id) return [];
    
    // If user is a team lead, only show teams they lead
    if (isTeamLead) {
      const teamIds = managedTeams
        .filter(team => team.projects?.some(p => p.project_id.toString() === formData.project_id))
        .map(team => team.team_id.toString());
      
      return teams.filter(team => teamIds.includes(team.team_id.toString()));
    }
    
    // For project managers and admins, show all teams in the project
    const teamIds = projectTeamMembers
      .map(member => member.team_id.toString())
      .filter((value, index, self) => self.indexOf(value) === index); // Get unique team IDs
    
    return teams.filter(team => teamIds.includes(team.team_id.toString()));
  };

  const canAssignToTeam = (teamId) => {
    // Admins and project managers can assign to any team
    if (isAdmin || isProjectManager) return true;
    
    // Team leads can only assign to their teams
    if (isTeamLead) {
      return managedTeams.some(team => team.team_id.toString() === teamId);
    }
    
    return false;
  };

  const renderAssigneeSection = () => {
    if (activeTab === 'internal') {
      return (
        <>
          {/* Team Selection - For admins, project managers, and visible but auto-selected for team leads */}
          {(isAdmin || isProjectManager || isTeamLead) && (
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel>Team</CFormLabel>
                <CFormSelect
                  name="team_id"
                  value={formData.team_id}
                  onChange={handleInputChange}
                  disabled={!formData.project_id || loading || submitting || isTeamLead}
                >
                  <option value="">Select Team</option>
                  {getFilteredTeams().map((team) => (
                    <option 
                      key={team.team_id} 
                      value={team.team_id}
                      disabled={!canAssignToTeam(team.team_id.toString())}
                    >
                      {team.name}
                    </option>
                  ))}
                </CFormSelect>
                {isTeamLead && formData.project_id && !formData.team_id && (
                  <div className="form-text text-info">
                    Team will be auto-selected based on your team lead assignments.
                  </div>
                )}
              </div>
            </CCol>
          )}

          {/* Employee Selection */}
          <CCol md={(isAdmin || isProjectManager || isTeamLead) ? 6 : 12}>
            <div className="mb-3">
              <CFormLabel>Assign To</CFormLabel>
              <CFormSelect
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleInputChange}
                disabled={loading || submitting}
                required
              >
                <option value="">Select Employee</option>
                {employees.map((employee) => (
                  <option key={employee.employee_id} value={employee.employee_id}>
                    {employee.employee_name || `${employee.first_name} ${employee.last_name}`}
                  </option>
                ))}
              </CFormSelect>
            </div>
          </CCol>
        </>
      );
    } else {
      // Customer assignee section
      return (
        <CCol md={12}>
          <div className="mb-3">
            <CFormLabel>Assign To</CFormLabel>
            <CFormSelect
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleInputChange}
              disabled={loading || submitting}
              required
            >
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer.customer_employee_id} value={customer.customer_employee_id}>
                  {customer.first_name} {customer.last_name}
                </option>
              ))}
            </CFormSelect>
          </div>
        </CCol>
      );
    }
  };

  // Show loading spinner while data is being fetched
  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <CSpinner />
      </div>
    );
  }

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <h5>{isEdit ? 'Edit Task' : 'Create New Task'}</h5>
      </CCardHeader>
      <CCardBody>
        {error && (
          <CAlert color="danger" dismissible onClose={() => setError('')}>
            {error}
          </CAlert>
        )}

        <CForm onSubmit={handleSubmit}>
          {/* Project Selection - Hidden for customer team heads as they only have one project */}
          {!isCustomerTeamsHead && (
            <CRow>
              <CCol md={12}>
                <div className="mb-3">
                  <CFormLabel>Project</CFormLabel>
                  <CFormSelect
                    name="project_id"
                    value={formData.project_id}
                    onChange={handleInputChange}
                    disabled={loading || submitting || isEdit || isCustomerTeamsHead}
                  >
                    <option value="">Select Project</option>
                    {projects.map((project) => (
                      <option key={project.project_id} value={project.project_id}>
                        {project.name}
                      </option>
                    ))}
                  </CFormSelect>
                  {isCustomerTeamsHead && formData.project_id && (
                    <div className="form-text">
                      Project: {projects.find(p => p.project_id.toString() === formData.project_id)?.name}
                    </div>
                  )}
                </div>
              </CCol>
            </CRow>
          )}

          {/* Task Type Tabs - Only show if user can create both internal and customer tasks */}
          {(isAdmin || isProjectManager) && formData.project_id && (
            <CNav variant="tabs" className="mb-3">
              <CNavItem>
                <CNavLink
                  active={activeTab === 'internal'}
                  onClick={() => handleTabChange('internal')}
                  style={{ cursor: 'pointer' }}
                >
                  Internal Task
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink
                  active={activeTab === 'customer'}
                  onClick={() => handleTabChange('customer')}
                  style={{ cursor: 'pointer' }}
                  disabled={isCustomerTeamsHead && !isAdmin && !isProjectManager}
                >
                  Customer Task
                </CNavLink>
              </CNavItem>
            </CNav>
          )}

          {/* Assignee Section */}
          <CRow>
            {renderAssigneeSection()}
          </CRow>

          {/* Task Details */}
          <CRow>
            <CCol md={12}>
              <div className="mb-3">
                <CFormLabel>Title</CFormLabel>
                <CFormInput
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  disabled={loading || submitting}
                />
              </div>
            </CCol>
          </CRow>

          <CRow>
            <CCol md={12}>
              <div className="mb-3">
                <CFormLabel>Description</CFormLabel>
                <CFormTextarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  disabled={loading || submitting}
                />
              </div>
            </CCol>
          </CRow>

          <CRow>
            <CCol md={4}>
              <div className="mb-3">
                <CFormLabel>Task Type</CFormLabel>
                <CFormSelect
                  name="task_type"
                  value={formData.task_type}
                  onChange={handleInputChange}
                  disabled={loading || submitting}
                >
                  <option value="Task">Task</option>
                  <option value="Bug">Bug</option>
                  <option value="Feature">Feature</option>
                  <option value="Improvement">Improvement</option>
                </CFormSelect>
              </div>
            </CCol>
            <CCol md={4}>
              <div className="mb-3">
                <CFormLabel>Priority</CFormLabel>
                <CFormSelect
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  disabled={loading || submitting}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </CFormSelect>
              </div>
            </CCol>
            <CCol md={4}>
              <div className="mb-3">
                <CFormLabel>Status</CFormLabel>
                <CFormSelect
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={loading || submitting || !isEdit}
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Done">Done</option>
                </CFormSelect>
              </div>
            </CCol>
          </CRow>

          <CRow>
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel>Due Date</CFormLabel>
                <CFormInput
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  disabled={loading || submitting}
                />
              </div>
            </CCol>
            {isEdit && (
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel>Hours Spent</CFormLabel>
                  <CFormInput
                    type="number"
                    name="hours_spent"
                    value={formData.hours_spent}
                    onChange={handleInputChange}
                    disabled={loading || submitting}
                    step="0.5"
                    min="0"
                  />
                </div>
              </CCol>
            )}
          </CRow>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <CButton
              color="secondary"
              onClick={() => navigate('/track-entries')}
              disabled={submitting}
            >
              Cancel
            </CButton>
            <CButton color="primary" type="submit" disabled={submitting}>
              {submitting ? <CSpinner size="sm" /> : isEdit ? 'Update Task' : 'Create Task'}
            </CButton>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  );
};

export default TrackEntryForm;