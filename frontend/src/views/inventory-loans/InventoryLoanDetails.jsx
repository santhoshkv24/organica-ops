import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Inventory2,
  AssignmentReturn,
  ArrowBack
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getInventoryLoanDetails,
  approveRejectInventoryLoan,
  issueInventoryLoan,
  returnInventoryLoanItems
} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

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

const InventoryLoanDetails = () => {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const { user, canApproveInventoryLoans, canIssueInventoryLoans, isHardwareTeamMember } = useAuth();
  
  const [loan, setLoan] = useState(null);
  const [loanItems, setLoanItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  
  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  
  // Form states for dialogs
  const [issueItems, setIssueItems] = useState([]);
  const [returnItems, setReturnItems] = useState([]);
  

  useEffect(() => {
    fetchLoanDetails();
  }, [loanId]);

  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getInventoryLoanDetails(loanId);
      console.log("API raw response:", res);
      console.log("API .data:", res.data);
      if (res.data && res.data.loanDetails) {
        setLoan(res.data.loanDetails);
        
        setLoanItems(res.data.loanItems || []);
        
        // Initialize issue items state
        if (res.data.loanDetails.status === 'Approved') {
          setIssueItems(res.data.loanItems.map(item => ({
            loan_item_id: item.loan_item_id,
            quantity_issued: item.quantity_requested
          })));
        }
        
        // Initialize return items state
        if (res.data.loanDetails.status === 'Issued' || res.data.loanDetails.status === 'Partially Returned') {
          setReturnItems(res.data.loanItems.map(item => ({
            loan_item_id: item.loan_item_id,
            quantity_returned: item.quantity_issued - (item.quantity_returned || 0)
          })));
        }
      }
    } catch (err) {
      console.error("Error fetching loan details:", err);
      setError("Failed to load loan details. Please try again.");
    } finally {
      setLoading(false);
    }
  };
console.log("Loan:",loan)
  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await approveRejectInventoryLoan(loanId, 'Approved');
      setActionSuccess('Loan approved successfully');
      setApproveDialogOpen(false);
      fetchLoanDetails(); // Refresh data
    } catch (err) {
      console.error("Error approving loan:", err);
      setError("Failed to approve loan. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      await approveRejectInventoryLoan(loanId, 'Rejected');
      setActionSuccess('Loan rejected');
      setRejectDialogOpen(false);
      fetchLoanDetails(); // Refresh data
    } catch (err) {
      console.error("Error rejecting loan:", err);
      setError("Failed to reject loan. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssueItemChange = (loanItemId, quantity) => {
    setIssueItems(prev => 
      prev.map(item => 
        item.loan_item_id === loanItemId 
          ? { ...item, quantity_issued: parseInt(quantity) || 0 }
          : item
      )
    );
  };

  const handleIssue = async () => {
    try {
      setActionLoading(true);
      await issueInventoryLoan(loanId, { items: issueItems });
      setActionSuccess('Items issued successfully');
      setIssueDialogOpen(false);
      fetchLoanDetails(); // Refresh data
    } catch (err) {
      console.error("Error issuing items:", err);
      setError("Failed to issue items. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnItemChange = (loanItemId, quantity) => {
    setReturnItems(prev => 
      prev.map(item => 
        item.loan_item_id === loanItemId 
          ? { ...item, quantity_returned: parseInt(quantity) || 0 }
          : item
      )
    );
  };

  const handleReturn = async () => {
    try {
      setActionLoading(true);
      await returnInventoryLoanItems(loanId, { items: returnItems });
      setActionSuccess('Items returned successfully');
      setReturnDialogOpen(false);
      fetchLoanDetails(); // Refresh data
    } catch (err) {
      console.error("Error returning items:", err);
      setError("Failed to return items. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const renderActionButtons = () => {
    if (!loan) {
      console.log('DEBUG - No loan, returning null');
      return null;
    }
    
    switch (loan.status) {
      case 'Pending Approval':
        console.log('DEBUG - Status is Pending Approval');
        // Only hardware team lead can approve/reject
        if (!canApproveInventoryLoans) {
          console.log('DEBUG - User cannot approve inventory loans');
          return null;
        }
        console.log('DEBUG - Rendering approve/reject buttons');
        return (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<CheckCircle />}
              onClick={() => setApproveDialogOpen(true)}
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              onClick={() => setRejectDialogOpen(true)}
            >
              Reject
            </Button>
          </Box>
        );
      
      case 'Approved':
        console.log('DEBUG - Status is Approved');
        // Hardware team members can issue items
        if (!canIssueInventoryLoans) {
          console.log('DEBUG - User cannot issue inventory loans');
          return null;
        }
        console.log('DEBUG - Rendering issue button');
        return (
          <Button
            variant="contained"
            color="primary"
            startIcon={<Inventory2 />}
            onClick={() => setIssueDialogOpen(true)}
          >
            Issue Items
          </Button>
        );
      
      case 'Issued':
      case 'Partially Returned':
        console.log('DEBUG - Status is Issued/Partially Returned');
        // Hardware team members can handle returns
        if (!canIssueInventoryLoans) {
          console.log('DEBUG - User cannot issue inventory loans (for returns)');
          return null;
        }
        console.log('DEBUG - Rendering return button');
        return (
          <Button
            variant="contained"
            color="success"
            startIcon={<AssignmentReturn />}
            onClick={() => setReturnDialogOpen(true)}
          >
            Return Items
          </Button>
        );
      
      default:
        console.log('DEBUG - Unknown status:', loan.status);
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          sx={{ mt: 2 }}
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/inventory-loans')}
        >
          Back to Loans
        </Button>
      </Box>
    );
  }

  if (!loan) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Loan not found</Alert>
        <Button
          sx={{ mt: 2 }}
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/inventory-loans')}
        >
          Back to Loans
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Back to Loans">
            <IconButton onClick={() => navigate('/inventory-loans')}>
              <ArrowBack />
            </IconButton>
          </Tooltip>
          <Typography variant="h4" component="h1">
            Inventory Loan Details
          </Typography>
          <Chip
            label={loan.status}
            color={getStatusChipColor(loan.status)}
            sx={{ ml: 2 }}
          />
        </Box>
        {renderActionButtons()}
      </Box>

      {actionSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Loan Information" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Loan ID</Typography>
                  <Typography variant="body1">{loan.loan_id}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Project</Typography>
                  <Typography variant="body1">{loan.project_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Requested By</Typography>
                  <Typography variant="body1">{loan.requester_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Responsible Team</Typography>
                  <Typography variant="body1">{loan.team_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Request Date</Typography>
                  <Typography variant="body1">
                    {loan.request_date ? format(new Date(loan.request_date), 'MMM dd, yyyy') : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Expected Return Date</Typography>
                  <Typography variant="body1">
                    {loan.expected_return_date ? format(new Date(loan.expected_return_date), 'MMM dd, yyyy') : 'N/A'}
                  </Typography>
                </Grid>
                {loan.approval_date && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Approval Date</Typography>
                    <Typography variant="body1">
                      {format(new Date(loan.approval_date), 'MMM dd, yyyy')}
                    </Typography>
                  </Grid>
                )}
                {loan.approved_by_name && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Approved By</Typography>
                    <Typography variant="body1">{loan.approved_by_name}</Typography>
                  </Grid>
                )}
                {loan.issued_date && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Issue Date</Typography>
                    <Typography variant="body1">
                      {format(new Date(loan.issued_date), 'MMM dd, yyyy')}
                    </Typography>
                  </Grid>
                )}
                {loan.issued_by_name && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Issued By</Typography>
                    <Typography variant="body1">{loan.issued_by_name}</Typography>
                  </Grid>
                )}
                {loan.actual_return_date && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Return Date</Typography>
                    <Typography variant="body1">
                      {format(new Date(loan.actual_return_date), 'MMM dd, yyyy')}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Purpose</Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>{loan.purpose}</Typography>
                </Grid>
                {loan.remarks && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Remarks</Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>{loan.remarks}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Loan Items" />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Requested</TableCell>
                      <TableCell align="right">Issued</TableCell>
                      <TableCell align="right">Returned</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loanItems.map((item) => (
                      <TableRow key={item.loan_item_id}>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell align="right">{item.quantity_requested}</TableCell>
                        <TableCell align="right">{item.quantity_issued || 'N/A'}</TableCell>
                        <TableCell align="right">{item.quantity_returned || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)}>
        <DialogTitle>Approve Inventory Loan</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to approve this inventory loan request?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
          <Button onClick={handleApprove} color="primary" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={24} /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Inventory Loan</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reject this inventory loan request?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
          <Button onClick={handleReject} color="error" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={24} /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Issue Dialog */}
      <Dialog open={issueDialogOpen} onClose={() => setIssueDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Issue Inventory Items</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Specify the quantity to issue for each item:
          </DialogContentText>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Requested Quantity</TableCell>
                  <TableCell align="right">Issue Quantity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loanItems.map((item) => {
                  const issueItem = issueItems.find(i => i.loan_item_id === item.loan_item_id);
                  return (
                    <TableRow key={item.loan_item_id}>
                      <TableCell>{item.item_name}</TableCell>
                      <TableCell align="right">{item.quantity_requested}</TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={issueItem?.quantity_issued || 0}
                          onChange={(e) => handleIssueItemChange(item.loan_item_id, e.target.value)}
                          inputProps={{ min: 0, max: item.quantity_requested }}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIssueDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
          <Button onClick={handleIssue} color="primary" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={24} /> : 'Issue Items'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={returnDialogOpen} onClose={() => setReturnDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Return Inventory Items</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Specify the quantity to return for each item:
          </DialogContentText>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Issued</TableCell>
                  <TableCell align="right">Already Returned</TableCell>
                  <TableCell align="right">Return Now</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loanItems.map((item) => {
                  const returnItem = returnItems.find(i => i.loan_item_id === item.loan_item_id);
                  const maxReturn = (item.quantity_issued || 0) - (item.quantity_returned || 0);
                  return (
                    <TableRow key={item.loan_item_id}>
                      <TableCell>{item.item_name}</TableCell>
                      <TableCell align="right">{item.quantity_issued || 0}</TableCell>
                      <TableCell align="right">{item.quantity_returned || 0}</TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={returnItem?.quantity_returned || 0}
                          onChange={(e) => handleReturnItemChange(item.loan_item_id, e.target.value)}
                          inputProps={{ min: 0, max: maxReturn }}
                          size="small"
                          disabled={maxReturn <= 0}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
          <Button onClick={handleReturn} color="primary" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={24} /> : 'Return Items'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryLoanDetails;