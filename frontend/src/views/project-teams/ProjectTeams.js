import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Assuming this path is correct

// MUI Components
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Card,
  CardHeader,
  CardContent,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { createTheme, ThemeProvider, useTheme, alpha } from '@mui/material/styles';

// MUI Icons
import GroupIcon from '@mui/icons-material/Group';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

// Mock API functions - replace with your actual imports
import {
  getProjects,
  getTeams,
  getEmployeesByTeam,
  getProjectTeamMembers,
  addProjectTeamMember,
  removeProjectTeamMember,
  getCustomerEmployeesByProject,
} from '../../services/api';

// A default theme to ensure the sx prop styling works
const defaultTheme = createTheme();

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
  const [customerTeamMembers, setCustomerTeamMembers] = useState([]);

  // UI/UX State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingCustomerTeam, setLoadingCustomerTeam] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const response = await getProjects();
        const projectData = response.data || [];
        setProjects(projectData);
        if (projectData.length > 0) {
          setSelectedProject(projectData[0].project_id.toString());
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to fetch projects. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch project-specific data when project selection changes
  useEffect(() => {
    if (selectedProject) {
      const fetchProjectData = async () => {
        setLoading(true);
        setLoadingCustomerTeam(true);
        try {
          const [membersRes, teamsRes, customerRes] = await Promise.all([
            getProjectTeamMembers(selectedProject),
            getTeams(),
            getCustomerEmployeesByProject(selectedProject),
          ]);
          setTeamMembers(membersRes.data || []);
          setTeams(teamsRes.data || []);
          setCustomerTeamMembers(customerRes.data || []);
        } catch (err) {
          console.error('Error fetching project data:', err);
          setError('Failed to fetch project details. Please try again.');
        } finally {
          setLoading(false);
          setLoadingCustomerTeam(false);
        }
      };
      fetchProjectData();
    } else {
      setTeamMembers([]);
      setCustomerTeamMembers([]);
      setTeams([]);
      setEmployees([]);
    }
  }, [selectedProject]);

  // Fetch employees when team selection changes
  useEffect(() => {
    if (selectedTeam) {
      const fetchTeamEmployees = async () => {
        try {
          const response = await getEmployeesByTeam(selectedTeam);
          setEmployees(response.data || []);
        } catch (err) {
          console.error('Error fetching employees:', err);
          setError('Failed to fetch employees for the selected team.');
        }
      };
      fetchTeamEmployees();
    } else {
      setEmployees([]);
    }
  }, [selectedTeam]);

  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    if (!selectedProject || !selectedTeam || !selectedEmployee) {
      setError('Please select a project, team, and employee.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const data = {
        project_id: parseInt(selectedProject),
        team_id: parseInt(selectedTeam),
        employee_id: parseInt(selectedEmployee),
        role: 'team_member', // Default role
      };
      await addProjectTeamMember(data);
      setSuccess('Team member added successfully.');
      setSelectedEmployee('');
      // Refetch members
      const response = await getProjectTeamMembers(selectedProject);
      setTeamMembers(response.data || []);
    } catch (err) {
      console.error('Error adding team member:', err);
      setError(`Failed to add team member. ${err.message || ''}`);
    } finally {
      setSubmitting(false);
    }
  };

  const openConfirmDialog = (memberId) => {
    setMemberToRemove(memberId);
    setConfirmDialogOpen(true);
  };

  const handleRemoveTeamMember = async () => {
    if (!memberToRemove) return;

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await removeProjectTeamMember(memberToRemove);
      setSuccess('Team member removed successfully.');
      // Refetch members
      const response = await getProjectTeamMembers(selectedProject);
      setTeamMembers(response.data || []);
    } catch (err) {
      console.error('Error removing team member:', err);
      setError(`Failed to remove team member. ${err.message || ''}`);
    } finally {
      setSubmitting(false);
      setConfirmDialogOpen(false);
      setMemberToRemove(null);
    }
  };

  const isEmployeeInTeam = (employeeId) => {
    return teamMembers.some(
      (member) =>
        member.employee_id.toString() === employeeId.toString() &&
        member.team_id.toString() === selectedTeam.toString()
    );
  };

  const availableEmployees = useMemo(() => {
    return employees.filter(
      (employee) => !isEmployeeInTeam(employee.employee_id)
    );
  }, [employees, teamMembers, selectedTeam]);

  const teamMembersByTeam = useMemo(() => {
    const groups = {};
    teamMembers.forEach((member) => {
      if (!groups[member.team_id]) {
        groups[member.team_id] = {
          team_name: member.team_name,
          members: [],
        };
      }
      groups[member.team_id].members.push(member);
    });
    return Object.entries(groups).map(([team_id, data]) => ({
      team_id,
      ...data,
    }));
  }, [teamMembers]);

  const theme = useTheme();
  const dataGridStyles = {
    '--DataGrid-containerBackground': theme.palette.background.paper,
    '--DataGrid-rowHeight': '60px',
    '--DataGrid-rowSpacing': '0px',
    '--DataGrid-cellPadding': '0 16px',
    '& .MuiDataGrid-columnHeaders': {
      backgroundColor: alpha(theme.palette.primary.main, 0.05),
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    '& .MuiDataGrid-columnHeader': {
      padding: '0 16px',
      '&:focus, &:focus-within': {
        outline: 'none',
      },
    },
    '& .MuiDataGrid-columnHeaderTitle': {
      fontWeight: 600,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    '& .MuiDataGrid-cell': {
      borderRight: `1px solid ${theme.palette.divider}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      '&:last-of-type': {
        borderRight: 'none',
      },
      '& > *': {
        width: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
      '&:focus, &:focus-within': {
        outline: 'none',
      },
    },
    '& .MuiDataGrid-row': {
      '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
      },
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
      },
    },
    '& .MuiDataGrid-footerContainer': {
      borderTop: `1px solid ${theme.palette.divider}`,
      '& .MuiTablePagination-root': {
        marginLeft: 'auto',
      },
    },
    '& .MuiDataGrid-virtualScroller': {
      '&::-webkit-scrollbar': {
        height: '8px',
        width: '8px',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: theme.palette.action.disabled,
        borderRadius: '4px',
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: theme.palette.background.default,
      },
    },
  };

  const internalTeamColumns = [
    { field: 'employee_name', headerName: 'Employee', flex: 1, minWidth: 180 },
    {
      field: 'role',
      headerName: 'Role',
      flex: 1,
      minWidth: 120,
      renderCell: (params) =>
        params.value === 'team_lead' ? (
          <Chip label="Team Lead" color="success" size="small" />
        ) : (
          <Chip label="Member" color="info" size="small" />
        ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) =>
        canManageProjects ? (
          <Tooltip title="Remove from Project">
            <IconButton
              color="error"
              size="small"
              onClick={() => openConfirmDialog(params.row.project_team_member_id)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        ) : null,
    },
  ];
  
  const customerTeamColumns = [
      { 
        field: 'name', 
        headerName: 'Name', 
        flex: 1, 
        minWidth: 180, 
        renderCell: (params) => `${params.row.first_name} ${params.row.last_name}` 
      },
      { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
      { 
        field: 'phone', 
        headerName: 'Phone', 
        flex: 1, 
        minWidth: 150, 
        renderCell: (params) => params.value || 'N/A' 
      },
      {
          field: 'is_head',
          headerName: 'Role',
          flex: 1,
          minWidth: 150,
          renderCell: (params) => params.value ? (
              <Chip label="Customer Head" color="primary" size="small" />
          ) : (
              <Chip label="Customer Member" color="secondary" size="small" />
          )
      }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <GroupIcon sx={{ mr: 1, fontSize: '2rem' }} color="primary" />
        <Typography variant="h4" component="h1">
          Project Teams
        </Typography>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Select Project</Typography>
        <FormControl fullWidth disabled={loading}>
          <InputLabel id="project-select-label">Project</InputLabel>
          <Select
            labelId="project-select-label"
            value={selectedProject}
            label="Project"
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <MenuItem value=""><em>Select a project</em></MenuItem>
            {projects.map((project) => (
              <MenuItem key={project.project_id} value={project.project_id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {selectedProject && canManageProjects && (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Add Team Member</Typography>
          <Box component="form" onSubmit={handleAddTeamMember}>
            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={12} md={5}>
                <FormControl fullWidth disabled={loading || submitting}>
                  <InputLabel id="team-select-label">Team</InputLabel>
                  <Select
                    labelId="team-select-label"
                    value={selectedTeam}
                    label="Team"
                    onChange={(e) => setSelectedTeam(e.target.value)}
                  >
                    <MenuItem value=""><em>Select a team</em></MenuItem>
                    {teams.map((team) => (
                      <MenuItem key={team.team_id} value={team.team_id}>
                        {team.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={5}>
                <FormControl fullWidth disabled={!selectedTeam || loading || submitting}>
                  <InputLabel id="employee-select-label">Employee</InputLabel>
                  <Select
                    labelId="employee-select-label"
                    value={selectedEmployee}
                    label="Employee"
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                  >
                    <MenuItem value=""><em>Select an employee</em></MenuItem>
                    {availableEmployees.map((emp) => (
                      <MenuItem key={emp.employee_id} value={emp.employee_id}>
                        {`${emp.first_name} ${emp.last_name}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={!selectedTeam || !selectedEmployee || submitting}
                  startIcon={submitting ? null : <AddCircleOutlineIcon />}
                >
                  {submitting ? <CircularProgress size={24} color="inherit" /> : 'Add'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}

      {selectedProject && (
        <>
          <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
            Internal Team Members
          </Typography>
          {loading ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
          ) : teamMembersByTeam.length > 0 ? (
            teamMembersByTeam.map((teamGroup) => (
              <Card key={teamGroup.team_id} sx={{ mb: 3 }} elevation={2}>
                <CardHeader title={teamGroup.team_name} />
                <CardContent sx={{ pt: 0 }}>
                    <Box sx={{ height: 'auto', width: '100%', minHeight: 200 }}>
                        <DataGrid
                            rows={teamGroup.members}
                            columns={internalTeamColumns}
                            getRowId={(row) => row.project_team_member_id}
                            autoHeight
                            disableRowSelectionOnClick
                            initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                            pageSizeOptions={[5, 10, 25]}
                            rowHeight={60}
                            sx={dataGridStyles}
                        />
                    </Box>
                </CardContent>
              </Card>
            ))
          ) : (
            <Alert severity="info">No internal team members assigned to this project yet.</Alert>
          )}

          <Typography variant="h5" component="h2" sx={{ mt: 5, mb: 2 }}>
            Customer Team
          </Typography>
          <Card elevation={2}>
            <CardContent>
              {loadingCustomerTeam ? (
                 <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
              ) : (
                <Box sx={{ height: 'auto', width: '100%', minHeight: 200 }}>
                    <DataGrid
                        rows={customerTeamMembers}
                        columns={customerTeamColumns}
                        getRowId={(row) => row.customer_employee_id}
                        autoHeight
                        disableRowSelectionOnClick
                        initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                        pageSizeOptions={[5, 10, 25]}
                        rowHeight={60}
                        sx={dataGridStyles}
                        localeText={{ noRowsLabel: 'No customer team members found for this project.' }}
                    />
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Confirmation Dialog for Removing Member */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirm Removal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this team member from the project?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleRemoveTeamMember} color="error" disabled={submitting}>
            {submitting ? <CircularProgress size={22} /> : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Wrap the component with a ThemeProvider to make the theme available
const ProjectTeamsWrapper = () => (
  <ThemeProvider theme={defaultTheme}>
    <ProjectTeams />
  </ThemeProvider>
);

export default ProjectTeamsWrapper;
