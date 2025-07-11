import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
  IconButton,
  Paper,
  Tabs,
  Tab,
  Tooltip
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Add, Visibility, CheckCircle, Cancel, Inventory2, AssignmentReturn, PendingActions } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getInventoryLoansByUser, getInventoryLoansPendingApproval, getInventoryLoansByTeam } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const getStatusChipColor = (status) => {
  switch (status) {
    case 'Pending Approval':
      return 'warning';
    case 'Approved':
      return 'info';
    case 'Rejected':
      return 'error';
    case 'Issued':
      return 'primary';
    case 'Partially Returned':
      return 'secondary';
    case 'Returned':
      return 'success';
    default:
      return 'default';
  }
};
const InventoryLoanDashboard = () => {
  const { user, canApproveInventoryLoans, canViewTeamInventoryLoans, isHardwareTeamMember } = useAuth();
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  const isAdmin = user && (user.role === 'admin' || user.role === 'manager');

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('DEBUG Dashboard - canViewTeamInventoryLoans:', canViewTeamInventoryLoans);
      console.log('DEBUG Dashboard - isHardwareTeamMember:', isHardwareTeamMember);
      console.log('DEBUG Dashboard - user:', user);
      
      let res;
      
      
      if (canViewTeamInventoryLoans) {
        // Hardware team members see all team requests
        console.log('DEBUG Dashboard - Fetching team requests for team ID 5');
        res = await getInventoryLoansByTeam(5); // Hardware team ID
        console.log('DEBUG Dashboard - Team requests response:', res);
      } else {
        // Regular employees see only their own requests
        console.log('DEBUG Dashboard - Fetching user requests');
        res = await getInventoryLoansByUser();
        console.log('DEBUG Dashboard - User requests response:', res);
      }
      
      console.log('DEBUG Dashboard - Raw API response:', res);
      const loansData = (res.data || []).map(loan => ({ 
        ...loan, 
        id: loan.loan_id 
      }));
      console.log('DEBUG Dashboard - Processed loans data:', loansData);
      setLoans(loansData);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Unable to load inventory loans.");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewLoan = (id) => {
    navigate(`/inventory-loans/${id}`);
  };

  const filteredLoans = () => {
    if (tabValue === 0) return loans;
    
    let statusMap;
    if (canApproveInventoryLoans) {
      // Hardware team lead sees: All | Pending Approval | Active | Completed | Rejected
      statusMap = {
        1: ['Pending Approval'],
        2: ['Approved', 'Issued'],
        3: ['Partially Returned', 'Returned'],
        4: ['Rejected']
      };
    } else {
      // Regular users see: My Requests | Active | Completed | Rejected
      statusMap = {
        1: ['Approved', 'Issued'],
        2: ['Partially Returned', 'Returned'],
        3: ['Rejected']
      };
    }
    
    return loans.filter(loan => statusMap[tabValue].includes(loan.status));
  };

  const columns = [
    {
      field: 'loan_id',
      headerName: 'Loan ID',
      width: 100,
    },
    {
      field: 'project_name',
      headerName: 'Project',
      flex: 2,
    },
    {
      field: 'team_name',
      headerName: 'Requested to (Team)',
      flex: 1,
    },
    {
      field: 'purpose',
      headerName: 'Purpose',
      flex: 2,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusChipColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'request_date',
      headerName: 'Request Date',
      flex: 1,
      type: 'date',
      valueGetter: (params) => params ? new Date(params) : null,
    },
    {
      field: 'expected_return_date',
      headerName: 'Expected Return',
      flex: 1,
      type: 'date',
      valueGetter: (params) => params? new Date(params) : null,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      flex: 1,
      renderCell: (params) => {
        return (
          <Box>
            <Tooltip title="View Details">
              <IconButton onClick={() => handleViewLoan(params.row.id)} color="primary">
                <Visibility />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Inventory Loans
        </Typography>
        {!isHardwareTeamMember && <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/inventory-loans/create')}
        >
          Request New Loan
        </Button>}
      </Box>

      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label={canViewTeamInventoryLoans ? "All Team Requests" : "My Requests"} 
            icon={<Inventory2 />} 
            iconPosition="start" 
          />
          {canApproveInventoryLoans && (
            <Tab 
              label="Pending Approval" 
              icon={<PendingActions />} 
              iconPosition="start" 
            />
          )}
          <Tab label="Active" icon={<CheckCircle />} iconPosition="start" />
          <Tab label="Completed" icon={<AssignmentReturn />} iconPosition="start" />
          <Tab label="Rejected" icon={<Cancel />} iconPosition="start" />
        </Tabs>
      </Paper>

      {error && <Typography color="error.main" sx={{ mb: 2 }}>{error}</Typography>}

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredLoans()}
          columns={columns}
          loading={loading}
          slots={{
            toolbar: GridToolbar,
            loadingOverlay: CircularProgress,
            noRowsOverlay: () => <Typography sx={{ p: 2 }}>No inventory loans found.</Typography>,
          }}
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

export default InventoryLoanDashboard;