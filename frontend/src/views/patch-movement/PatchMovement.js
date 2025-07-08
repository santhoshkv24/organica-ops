import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Select,
  MenuItem,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Box,
  Input,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext'; // Assuming this hook provides user info
import apiService from '../../services/apiService'; // Assuming this is your configured api service
import DataGrid from '../../components/DataGrid'; // Assuming this is your DataGrid component

// Mockup for useAuth and apiService if they are not available in this context
// In your actual app, you would remove these mocks.
const useAuth = () => ({
  user: { id: 1, role: 'team_lead', name: 'John Doe' }, // Example user
});

const apiService = {
  get: async (url) => {
    console.log(`GET request to: ${url}`);
    if (url.startsWith('/projects/user/')) {
      return {
        data: [
          { project_id: 1, name: 'Project Alpha' },
          { project_id: 2, name: 'Project Beta' },
        ],
      };
    }
    if (url.startsWith('/patch-movements/user/')) {
      return {
        data: [
          { id: 101, project_name: 'Project Alpha', patch_name: 'Fix Login Bug', status: 'Pending', created_at: '2024-07-08T10:00:00Z', patch_type: 'Bug Fix', severity: 'High' },
        ],
      };
    }
    if (url.startsWith('/patch-movements/team-lead/')) {
        return {
            data: [
                { id: 102, project_name: 'Project Beta', requester_name: 'Jane Smith', patch_name: 'Add New Feature', status: 'Pending', created_at: '2024-07-08T11:30:00Z', patch_type: 'Feature Patch', severity: 'Medium' },
                { id: 103, project_name: 'Project Alpha', requester_name: 'Mike Johnson', patch_name: 'Security Hotfix', status: 'Pending', created_at: '2024-07-08T12:00:00Z', patch_type: 'Hotfix', severity: 'Critical' },
            ],
        };
    }
    return { data: [] };
  },
  post: async (url, data) => {
    console.log(`POST request to: ${url}`, data);
    // Simulate a successful post
    return { data: { message: 'Request created successfully' } };
  },
  patch: async (url, data) => {
    console.log(`PATCH request to: ${url}`, data);
    // Simulate a successful patch
    return { data: { message: 'Status updated successfully' } };
  },
};
// End of mocks

const PatchMovement = () => {
  const { user } = useAuth();

  // State for form data
  const [newRequest, setNewRequest] = useState({
    project_id: '',
    patch_name: '',
    patch_description: '',
    patch_type: '',
    severity: '',
    environment_affected: '',
    estimated_deployment_time: '',
    scheduled_deployment_time: '',
  });
  const [attachedDocument, setAttachedDocument] = useState(null);

  // State for data from API
  const [projects, setProjects] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [teamRequests, setTeamRequests] = useState([]);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const projectsRes = await apiService.get(`/projects/user/${user.id}`);
        setProjects(projectsRes.data);

        const myRequestsRes = await apiService.get(`/patch-movements/user/${user.id}`);
        setMyRequests(myRequestsRes.data);

        if (user.role === 'team_lead') {
          const teamRequestsRes = await apiService.get(`/patch-movements/team-lead/${user.id}`);
          setTeamRequests(teamRequestsRes.data);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        // You might want to add user-facing error handling here
      }
    };

    fetchInitialData();
  }, [user.id, user.role]);

  // Handlers for form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRequest((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setAttachedDocument(e.target.files[0]);
  };

  // Handler for form submission
  const handleCreateRequest = async () => {
    // Basic validation
    if (!newRequest.project_id || !newRequest.patch_name || !newRequest.patch_type || !newRequest.severity || !newRequest.environment_affected) {
        alert('Please fill in all required fields.');
        return;
    }

    const formData = new FormData();
    // Append all form fields to FormData
    Object.keys(newRequest).forEach(key => {
        formData.append(key, newRequest[key]);
    });

    // Append user id
    formData.append('requested_by', user.id);

    if (attachedDocument) {
      formData.append('attached_document', attachedDocument);
    }

    try {
      await apiService.post('/patch-movements', formData);
      // Refresh my requests list after successful creation
      const response = await apiService.get(`/patch-movements/user/${user.id}`);
      setMyRequests(response.data);
      // Reset form
      setNewRequest({
        project_id: '',
        patch_name: '',
        patch_description: '',
        patch_type: '',
        severity: '',
        environment_affected: '',
        estimated_deployment_time: '',
        scheduled_deployment_time: '',
      });
      setAttachedDocument(null);
      alert('Request submitted successfully!');
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Failed to create request. Please try again.');
    }
  };

  // Handler for updating request status by team lead
  const handleUpdateRequestStatus = async (id, status) => {
    try {
      await apiService.patch(`/patch-movements/${id}/status`, { status, approved_by: user.id });
      // Refresh team requests list
      const response = await apiService.get(`/patch-movements/team-lead/${user.id}`);
      setTeamRequests(response.data);
      alert(`Request ${id} has been ${status}.`);
    } catch (error) {
      console.error('Error updating request status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  // Column definitions for the DataGrids
  const myRequestsColumns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'project_name', headerName: 'Project', width: 150 },
    { field: 'patch_name', headerName: 'Patch Name', width: 200 },
    { field: 'patch_type', headerName: 'Type', width: 130 },
    { field: 'severity', headerName: 'Severity', width: 100 },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'created_at', headerName: 'Created At', width: 180, type: 'dateTime', valueGetter: (params) => new Date(params) },
  ];

  const teamRequestsColumns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'requester_name', headerName: 'Requester', width: 130 },
    { field: 'project_name', headerName: 'Project', width: 150 },
    { field: 'patch_name', headerName: 'Patch Name', width: 200 },
    { field: 'status', headerName: 'Status', width: 100 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      renderCell: (params) => (
        params.row.status === 'Pending' && (
          <Box>
            <Button variant="contained" color="success" size="small" onClick={() => handleUpdateRequestStatus(params.row.id, 'Approved')}>
              Approve
            </Button>
            <Button variant="contained" color="error" size="small" onClick={() => handleUpdateRequestStatus(params.row.id, 'Rejected')} style={{ marginLeft: 8 }}>
              Reject
            </Button>
             <Button variant="contained" color="warning" size="small" onClick={() => handleUpdateRequestStatus(params.row.id, 'On Hold')} style={{ marginLeft: 8 }}>
              Hold
            </Button>
          </Box>
        )
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Patch Movement Requests
      </Typography>
      <Grid container spacing={3}>
        {/* Create New Request Form */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Create New Request</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Project</InputLabel>
                  <Select name="project_id" value={newRequest.project_id} label="Project" onChange={handleInputChange}>
                    {projects.map((project) => (
                      <MenuItem key={project.project_id} value={project.project_id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField name="patch_name" label="Patch Name" value={newRequest.patch_name} onChange={handleInputChange} fullWidth required />
              </Grid>
              <Grid item xs={12}>
                <TextField name="patch_description" label="Patch Description" value={newRequest.patch_description} onChange={handleInputChange} multiline rows={3} fullWidth required />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth required>
                  <InputLabel>Patch Type</InputLabel>
                  <Select name="patch_type" value={newRequest.patch_type} label="Patch Type" onChange={handleInputChange}>
                    <MenuItem value="Hotfix">Hotfix</MenuItem>
                    <MenuItem value="Security Update">Security Update</MenuItem>
                    <MenuItem value="Feature Patch">Feature Patch</MenuItem>
                    <MenuItem value="Bug Fix">Bug Fix</MenuItem>
                    <MenuItem value="Emergency">Emergency</MenuItem>
                    <MenuItem value="Maintenance">Maintenance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth required>
                  <InputLabel>Severity</InputLabel>
                  <Select name="severity" value={newRequest.severity} label="Severity" onChange={handleInputChange}>
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth required>
                  <InputLabel>Environment Affected</InputLabel>
                  <Select name="environment_affected" value={newRequest.environment_affected} label="Environment Affected" onChange={handleInputChange}>
                    <MenuItem value="Dev">Dev</MenuItem>
                    <MenuItem value="QA">QA</MenuItem>
                    <MenuItem value="UAT">UAT</MenuItem>
                    <MenuItem value="Production">Production</MenuItem>
                    <MenuItem value="All">All</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField name="estimated_deployment_time" label="Estimated Deployment Time (mins)" type="number" value={newRequest.estimated_deployment_time} onChange={handleInputChange} fullWidth required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="scheduled_deployment_time"
                  label="Scheduled Deployment Time"
                  type="datetime-local"
                  value={newRequest.scheduled_deployment_time}
                  onChange={handleInputChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
               <Grid item xs={12} sm={6}>
                 <Button variant="outlined" component="label" fullWidth>
                    Attach Document
                    <input type="file" hidden onChange={handleFileChange} />
                </Button>
                {attachedDocument && <Typography variant="body2" sx={{mt: 1}}>{attachedDocument.name}</Typography>}
              </Grid>
              <Grid item xs={12} container justifyContent="flex-end">
                <Button variant="contained" color="primary" onClick={handleCreateRequest}>
                  Submit Request
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* My Requests Grid */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 400, width: '100%' }}>
            <Typography variant="h6">My Requests</Typography>
            <DataGrid
              rows={myRequests}
              columns={myRequestsColumns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              getRowId={(row) => row.id}
            />
          </Paper>
        </Grid>

        {/* Team Requests Grid (for Team Leads) */}
        {user.role === 'team_lead' && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, height: 400, width: '100%' }}>
              <Typography variant="h6">Team Requests for Approval</Typography>
              <DataGrid
                rows={teamRequests}
                columns={teamRequestsColumns}
                pageSize={5}
                rowsPerPageOptions={[5]}
                getRowId={(row) => row.id}
              />
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default PatchMovement;
