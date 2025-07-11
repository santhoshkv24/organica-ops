import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Avatar,
  Fade,
  Zoom
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getCompanies, deleteCompany } from '../../services/api';
import CompanyFormDialog from './CompanyFormDialog';
import CompanyDeleteDialog from './CompanyDeleteDialog';
import { format } from 'date-fns';

const CompaniesMUI = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [formMode, setFormMode] = useState('create'); // 'create', 'edit', 'view'

  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCompanies();
      const companiesData = response.data?.data || response.data || [];
      setCompanies(companiesData);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
      setError('Failed to load divisions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = () => {
    setSelectedCompany(null);
    setFormMode('create');
    setFormDialogOpen(true);
  };

  const handleEditCompany = (company) => {
    setSelectedCompany(company);
    setFormMode('edit');
    setFormDialogOpen(true);
  };

  const handleViewCompany = (company) => {
    setSelectedCompany(company);
    setFormMode('view');
    setFormDialogOpen(true);
  };

  const handleDeleteCompany = (company) => {
    setSelectedCompany(company);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async () => {
    setSuccess('Division saved successfully!');
    setTimeout(() => setSuccess(null), 3000);
    await fetchCompanies();
  };

  const handleDeleteConfirm = async () => {
    try {
      const companyId = selectedCompany.branch_id || selectedCompany.company_id;
      await deleteCompany(companyId);
      setSuccess('Division deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
      await fetchCompanies();
    } catch (err) {
      setError('Failed to delete division. It may have associated teams or employees.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Filter companies based on search term and tab
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = !searchTerm || 
      company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.contact_phone?.toLowerCase().includes(searchTerm.toLowerCase());

    // Tab filtering (you can extend this based on company status/type)
    if (tabValue === 1) {
      // Example: Active companies (you can modify based on your data structure)
      return matchesSearch;
    }
    
    return matchesSearch;
  });

  const columns = [
    {
      field: 'name',
      headerName: 'Division',
      flex: 2,
      minWidth: 300,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            <BusinessIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              {params.value}
            </Typography>
            {params.row.website && (
              <Typography variant="caption" color="text.secondary">
                {params.row.website}
              </Typography>
            )}
          </Box>
        </Box>
      ),
    },
    {
      field: 'address',
      headerName: 'Address',
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
          <LocationIcon color="action" fontSize="small" />
          <Typography variant="body2">
            {params.value || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'contact_email',
      headerName: 'Email',
      flex: 1.5,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
          <EmailIcon color="action" fontSize="small" />
          {params.value ? (
            <Typography 
              variant="body2" 
              component="a" 
              href={`mailto:${params.value}`}
              sx={{ textDecoration: 'none', color: 'primary.main' }}
            >
              {params.value}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">N/A</Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'contact_phone',
      headerName: 'Phone',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
          <PhoneIcon color="action" fontSize="small" />
          {params.value ? (
            <Typography 
              variant="body2" 
              component="a" 
              href={`tel:${params.value}`}
              sx={{ textDecoration: 'none', color: 'primary.main' }}
            >
              {params.value}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">N/A</Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2">
            {params.value ? format(new Date(params.value), 'MMM dd, yyyy') : 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, height: '100%' }}>
          <Tooltip title="View Details">
            <IconButton 
              size="small" 
              onClick={() => handleViewCompany(params.row)}
              color="info"
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {isAdmin && (
            <>
              <Tooltip title="Edit Division">
                <IconButton 
                  size="small" 
                  onClick={() => handleEditCompany(params.row)}
                  color="primary"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Division">
                <IconButton 
                  size="small" 
                  onClick={() => handleDeleteCompany(params.row)}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      ),
    },
  ];

  if (loading && companies.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Divisions Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchCompanies} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateCompany}
              sx={{ borderRadius: 2 }}
            >
              Add Division
            </Button>
          )}
        </Box>
      </Box>

      {/* Alerts */}
      {success && (
        <Fade in={Boolean(success)}>
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        </Fade>
      )}
      {error && (
        <Fade in={Boolean(error)}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </Fade>
      )}

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search divisions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
              <Chip 
                label={`${filteredCompanies.length} Division${filteredCompanies.length !== 1 ? 's' : ''}`}
                color="primary"
                variant="outlined"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Data Grid */}
      <Paper sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={filteredCompanies}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.branch_id || row.company_id || row.id}
          slots={{
            toolbar: GridToolbar,
            loadingOverlay: CircularProgress,
            noRowsOverlay: () => (
              <Box sx={{ display: 'flex', flexDirection: 'column',alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No divisions found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first division'}
                </Typography>
              </Box>
            ),
          }}
          disableSelectionOnClick
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Form Dialog */}
      <CompanyFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        company={selectedCompany}
        mode={formMode}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Dialog */}
      <CompanyDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        company={selectedCompany}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  );
};

export default CompaniesMUI;
