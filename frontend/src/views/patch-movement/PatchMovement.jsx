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
  Alert,
  Snackbar,
  Stack,
  Chip,
  Modal,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useAuth } from '../../contexts/AuthContext';
import {
  createPatchMovementRequest,
  getPatchMovementRequestsByUser,
  getPatchMovementRequestByTeamLeadId,
  updatePatchMovementRequestStatus,
  getProjectsByUser,
} from '../../services/api';
import { AddCircleOutline, Close as CloseIcon, CloudUpload as CloudUploadIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import RequestDetailsModal from './RequestDetailsModal'; // Import the new modal

// --- Modal for Creating a New Request ---
const CreateRequestModal = ({ open, onClose, onSubmitted }) => {
  const { user } = useAuth();
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
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      const fetchProjects = async () => {
        try {
          const response = await getProjectsByUser(user.user_id);
          setProjects(response.data || []);
        } catch (err) {
          setError("Failed to load projects.");
        }
      };
      fetchProjects();
    }
  }, [open, user.user_id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRequest((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setAttachedDocument(e.target.files[0]);
  };

  const handleCreateRequest = async () => {
    if (!newRequest.project_id || !newRequest.patch_name || !newRequest.patch_type || !newRequest.severity || !newRequest.environment_affected) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      Object.keys(newRequest).forEach(key => {
        formData.append(key, newRequest[key]);
      });
      formData.append('requested_by', user.user_id);
      if (attachedDocument) {
        formData.append('attached_document', attachedDocument);
      }

      await createPatchMovementRequest(formData);
      onSubmitted(); // Notify parent to refresh data and close modal
    } catch (err) {
      setError(err.message || 'Failed to create request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Paper sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: 600,
        p: 4,
        borderRadius: 2,
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">Create New Patch Request</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Stack>
        
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Project Selection */}
          <FormControl fullWidth required>
            <InputLabel>Project</InputLabel>
            <Select 
              name="project_id" 
              value={newRequest.project_id} 
              label="Project" 
              onChange={handleInputChange} 
              disabled={loading}
            >
              {projects.map((p) => (
                <MenuItem key={p.project_id} value={p.project_id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Patch Name */}
          <TextField
            name="patch_name"
            label="Patch Name"
            value={newRequest.patch_name}
            onChange={handleInputChange}
            fullWidth
            required
            disabled={loading}
          />

          {/* Patch Description */}
          <TextField
            name="patch_description"
            label="Patch Description"
            value={newRequest.patch_description}
            onChange={handleInputChange}
            multiline
            rows={3}
            fullWidth
            required
            disabled={loading}
          />

          {/* Patch Type */}
          <FormControl fullWidth required>
            <InputLabel>Patch Type</InputLabel>
            <Select 
              name="patch_type" 
              value={newRequest.patch_type} 
              label="Patch Type" 
              onChange={handleInputChange} 
              disabled={loading}
            >
              <MenuItem value="Hotfix">Hotfix</MenuItem>
              <MenuItem value="Security Update">Security Update</MenuItem>
              <MenuItem value="Feature Patch">Feature Patch</MenuItem>
            </Select>
          </FormControl>

          {/* Severity */}
          <FormControl fullWidth required>
            <InputLabel>Severity</InputLabel>
            <Select 
              name="severity" 
              value={newRequest.severity} 
              label="Severity" 
              onChange={handleInputChange} 
              disabled={loading}
            >
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Critical">Critical</MenuItem>
            </Select>
          </FormControl>

          {/* Environment Affected */}
          <FormControl fullWidth required>
            <InputLabel>Environment Affected</InputLabel>
            <Select
              name="environment_affected"
              value={newRequest.environment_affected}
              label="Environment Affected"
              onChange={handleInputChange}
              disabled={loading}
            >
              <MenuItem value="Dev">Dev</MenuItem>
              <MenuItem value="QA">QA</MenuItem>
              <MenuItem value="Production">Production</MenuItem>
            </Select>
          </FormControl>

          {/* Estimated Deployment Time */}
          <TextField
            name="estimated_deployment_time"
            label="Estimated Deployment Time (minutes)"
            type="number"
            value={newRequest.estimated_deployment_time}
            onChange={handleInputChange}
            fullWidth
            required
            disabled={loading}
            inputProps={{ min: 0 }}
          />

          {/* Scheduled Deployment Time */}
          <TextField
            name="scheduled_deployment_time"
            label="Scheduled Deployment Time"
            type="datetime-local"
            value={newRequest.scheduled_deployment_time}
            onChange={handleInputChange}
            fullWidth
            disabled={loading}
            InputLabelProps={{ shrink: true }}
          />

          {/* File Upload */}
          <Box>
            <Button 
              variant="outlined" 
              component="label" 
              startIcon={<CloudUploadIcon />} 
              fullWidth
              sx={{ mb: 1 }}
            >
              Attach Document
              <input type="file" hidden onChange={handleFileChange} />
            </Button>
            {attachedDocument && (
              <Typography variant="body2" color="text.secondary">
                Selected: {attachedDocument.name}
              </Typography>
            )}
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 2 }}>
            <Button 
              onClick={onClose} 
              color="secondary" 
              disabled={loading}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRequest} 
              variant="contained" 
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Modal>
  );
};


// --- Main Page Component ---
const PatchMovement = () => {
  const { user } = useAuth();
  const [myRequests, setMyRequests] = useState([]);
  const [teamRequests, setTeamRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const isEmployee = user?.role === 'employee' || user?.role === 'team_member';
  const isTeamLead = user?.role === 'team_lead';

  const fetchData = async () => {
    if (!user?.user_id) return;
    setLoading(true);
    try {
      if (isEmployee) {
        const myRequestsResponse = await getPatchMovementRequestsByUser(user.user_id);
        setMyRequests(myRequestsResponse.data || []);
      }
      if (isTeamLead) {
        const teamRequestsResponse = await getPatchMovementRequestByTeamLeadId(user.user_id);
        setTeamRequests(teamRequestsResponse.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.user_id, user?.role]);

  const handleUpdateRequestStatus = async (id, status) => {
    setLoading(true);
    setError(null);
    try {
      await updatePatchMovementRequestStatus(id, status, user.user_id);
      setSuccess(`Request ${id} has been ${status.toLowerCase()}.`);
      fetchData(); // Refresh data after update
    } catch (error) {
      setError(error.message || 'Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalSubmitted = () => {
    setSuccess('Request submitted successfully!');
    setCreateModalOpen(false);
    fetchData();
  }

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setDetailsModalOpen(true);
  };

  const getStatusChip = (status) => {
    const colorMap = {
      Pending: 'warning',
      Approved: 'success',
      Rejected: 'error',
      'On Hold': 'default',
    };
    return <Chip label={status} color={colorMap[status] || 'default'} size="small" />;
  };

  const baseColumns = [
    { field: 'patch_name', headerName: 'Patch Name', flex: 2, minWidth: 200 },
    { field: 'patch_type', headerName: 'Patch Type', flex: 1, minWidth: 150 },
    { field: 'project_name', headerName: 'Project', flex: 1, minWidth: 150 },
    { field: 'status', headerName: 'Status', width: 120, renderCell: (params) => getStatusChip(params.value) },
  ];

  const myRequestsColumns = [
    ...baseColumns,
    {
      field: 'created_at',
      headerName: 'Created',
      width: 180,
      type: 'dateTime',
      valueGetter: (p) => p ? new Date(p) : null
    },
    {
      field: 'view',
      headerName: 'Details',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          startIcon={<VisibilityIcon />}
          onClick={() => handleViewDetails(params.row)}
        >
          View
        </Button>
      ),
    },
  ];

  const teamRequestsColumns = [
    ...baseColumns,
    {
      field: 'created_at',
      headerName: 'Requested',
      width: 180,
      type: 'dateTime',
      valueGetter: (p) => p ? new Date(p) : null
    },
    { field: 'requester_name', headerName: 'Requester', width: 130 },
    {
      field: 'view',
      headerName: 'Details',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          startIcon={<VisibilityIcon />}
          onClick={() => handleViewDetails(params.row)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Patch Movement
        </Typography>
        {isEmployee && (
          <Button
            variant="contained"
            startIcon={<AddCircleOutline />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Request
          </Button>
        )}
      </Stack>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>{success}</Alert>
      </Snackbar>

      <CreateRequestModal open={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onSubmitted={handleModalSubmitted} />
      {selectedRequest && (
        <RequestDetailsModal request={selectedRequest} open={isDetailsModalOpen} onClose={() => setDetailsModalOpen(false)} />
      )}

      <Grid>
        {isTeamLead && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>Team Requests for Approval</Typography>
              <Box sx={{ height: 500, width: '100%' }}>
                <DataGrid
                  rows={teamRequests}
                  columns={teamRequestsColumns}
                  getRowId={(row) => row.patch_id}
                  loading={loading}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 10 } },
                  }}
                  pageSizeOptions={[10, 25, 50]}
                />
              </Box>
            </Paper>
          </Grid>
        )}

        {isEmployee && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>My Requests</Typography>
              <Box sx={{ height: 500, width: '100%' }}>
                <DataGrid
                  rows={myRequests}
                  columns={myRequestsColumns}
                  getRowId={(row) => row.patch_id}
                  loading={loading}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 10 } },
                  }}
                  pageSizeOptions={[10, 25, 50]}
                />
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default PatchMovement;