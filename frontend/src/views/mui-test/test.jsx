import React, { useState, useEffect } from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid'; // Import GridToolbar
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
  IconButton,
  Paper,
  Avatar
} from '@mui/material';
import { Add, Edit, Delete, Business } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getProjects, deleteProject } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const getStatusChipColor = (status) => {
  switch (status) {
    case 'not_started':
      return 'default';
    case 'in_progress':
      return 'primary';
    case 'on_hold':
      return 'warning';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const formatStatus = (status) =>
  status ? status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'Unknown';

const ProjectsMuiView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isAdmin = user && (user.role === 'admin' || user.role === 'manager');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getProjects();
      const projectsData = (res.data.data || res.data || []).map(p => ({ ...p, id: p.project_id }));
      setProjects(projectsData);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Unable to load projects.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(id);
        await fetchProjects();
      } catch (err) {
        console.error("Delete error:", err);
        alert("Failed to delete project.");
      }
    }
  };

  const handleEditProject = (id) => {
    navigate(`/projects/edit/${id}`);
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Project Name',
      flex: 3,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
            <Business />
          </Avatar>
          <Box>
            <Typography variant="body1" fontWeight="bold">{params.value} <Chip
              label={formatStatus(params.row.status)}
              color={getStatusChipColor(params.row.status)}
              size="small"
            /></Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'customer_company_name',
      headerName: 'Customer Company',
      flex: 1.5,
      valueGetter: (params) => params || 'N/A',
    },
    {
      field: 'manager_name',
      headerName: 'Manager',
      flex: 1,
      valueGetter: (params) => params || 'Not Assigned',
    },
    {
      field: 'start_date',
      headerName: 'Start Date',
      flex: 1,
      type: 'date',
      valueGetter: (params) => params ? new Date(params) : null,
    },
    {
      field: 'end_date',
      headerName: 'End Date',
      flex: 1,
      type: 'date',
      valueGetter: (params) => params ? new Date(params) : null,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      flex: 1,
      renderCell: (params) => {
        if (!isAdmin) return null;
        return (
          <Box>
            <IconButton onClick={() => handleEditProject(params.row.id)} color="primary">
              <Edit />
            </IconButton>
            <IconButton onClick={() => handleDeleteProject(params.row.id)} color="error">
              <Delete />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Projects (MUI)
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/projects/create')}
          >
            Add New Project
          </Button>
        )}
      </Box>

      {error && <Typography color="error.main" sx={{ mb: 2 }}>{error}</Typography>}

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={projects}
          columns={columns}
          loading={loading}
          slots={{
            toolbar: GridToolbar, // Add the toolbar here
            loadingOverlay: CircularProgress,
            noRowsOverlay: () => <Typography sx={{ p: 2 }}>No projects found.</Typography>,
          }}
          checkboxSelection
          disableSelectionOnClick
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 20]}
        />
      </Paper>
    </Box>
  );
};

export default ProjectsMuiView;