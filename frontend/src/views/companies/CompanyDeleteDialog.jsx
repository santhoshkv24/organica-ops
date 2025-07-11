import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { deleteCompany } from '../../services/api';

const CompanyDeleteDialog = ({ open, onClose, company, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    if (!company) return;

    setLoading(true);
    setError(null);

    try {
      const branchId = company.branch_id || company.company_id;
      if (!branchId) {
        throw new Error('Invalid company ID');
      }

      await deleteCompany(branchId);
      
      if (onConfirm) {
        onConfirm();
      }
      onClose();
    } catch (err) {
      console.error('Error deleting company:', err);
      setError(err.message || 'Failed to delete division. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setError(null);
    onClose();
  };

  if (!company) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'error.main'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          <Typography variant="h6" component="div">
            Delete Division
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          disabled={loading}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Warning:</strong> This action cannot be undone. Deleting this division will also affect all departments and teams associated with it.
          </Typography>
        </Alert>

        <Typography variant="body1" gutterBottom>
          Are you sure you want to delete the following division?
        </Typography>

        <Paper
          elevation={0}
          sx={{
            mt: 2,
            p: 3,
            backgroundColor: 'grey.50',
            border: '1px solid',
            borderColor: 'grey.200',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <BusinessIcon color="primary" sx={{ mt: 0.5 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" component="div" gutterBottom>
                {company.name}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {company.address && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {company.address}
                    </Typography>
                  </Box>
                )}
                
                {company.contact_email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {company.contact_email}
                    </Typography>
                  </Box>
                )}
                
                {company.contact_phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {company.contact_phone}
                    </Typography>
                  </Box>
                )}
              </Box>

              {company.created_at && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'grey.300' }}>
                  <Chip
                    label={`Created: ${new Date(company.created_at).toLocaleDateString()}`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                </Box>
              )}
            </Box>
          </Box>
        </Paper>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            This will permanently remove:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              The division record and all its data
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              All associated departments and teams
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Historical records and relationships
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          startIcon={<CancelIcon />}
          color="inherit"
        >
          Cancel
        </Button>
        
        <Button
          onClick={handleDelete}
          disabled={loading}
          variant="contained"
          color="error"
          startIcon={loading ? <CircularProgress size={16} /> : <DeleteIcon />}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompanyDeleteDialog;
