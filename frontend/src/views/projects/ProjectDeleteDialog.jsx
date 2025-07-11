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
  Divider,
  Grid
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  DateRange as DateIcon,
  AttachMoney as MoneyIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { deleteProject } from '../../services/api';
import { format } from 'date-fns';

const ProjectDeleteDialog = ({ open, onClose, project, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    if (!project) return;

    setLoading(true);
    setError(null);

    try {
      await deleteProject(project.project_id);
      
      if (onConfirm) {
        onConfirm();
      }
      onClose();
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err.message || 'Failed to delete project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setError(null);
    onClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'planning':
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

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (!project) {
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
            Delete Project
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
            <strong>Warning:</strong> This action cannot be undone. Deleting this project will also remove all associated teams, tasks, and historical data.
          </Typography>
        </Alert>

        <Typography variant="body1" gutterBottom>
          Are you sure you want to delete the following project?
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
            <WorkIcon color="primary" sx={{ mt: 0.5 }} />
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h6" component="div">
                  {project.name}
                </Typography>
                <Chip
                  label={formatStatus(project.status)}
                  size="small"
                  color={getStatusColor(project.status)}
                  variant="outlined"
                />
              </Box>
              
              <Grid container spacing={2}>
                {project.customer_company_name && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        <strong>Customer:</strong> {project.customer_company_name}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                
                {project.manager_name && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        <strong>Manager:</strong> {project.manager_name}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {(project.start_date || project.end_date) && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DateIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        <strong>Duration:</strong>{' '}
                        {project.start_date ? format(new Date(project.start_date), 'MMM dd, yyyy') : 'TBD'}
                        {' - '}
                        {project.end_date ? format(new Date(project.end_date), 'MMM dd, yyyy') : 'TBD'}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {project.budget && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MoneyIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        <strong>Budget:</strong> ${parseFloat(project.budget).toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {project.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      <strong>Description:</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      mt: 0.5, 
                      fontStyle: 'italic',
                      maxHeight: 60,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {project.description}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {project.created_at && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'grey.300' }}>
                  <Chip
                    label={`Created: ${format(new Date(project.created_at), 'MMM dd, yyyy')}`}
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
          <Typography variant="body2" color="text.secondary" gutterBottom>
            This will permanently remove:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              The project record and all its data
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              All associated project teams and members
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Project timeline and milestone data
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Related meetings, tasks, and documentation
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Historical project reports and analytics
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Note:</strong> If this project has active teams or ongoing tasks, 
            consider changing the status to "Cancelled" instead of deleting it to preserve historical data.
          </Typography>
        </Alert>
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
          sx={{ minWidth: 140 }}
        >
          {loading ? 'Deleting...' : 'Delete Project'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectDeleteDialog;
