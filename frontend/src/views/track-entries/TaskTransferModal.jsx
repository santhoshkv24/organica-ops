import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Avatar,
  ListItemAvatar,
  ListItemText,
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  Close as CloseIcon,
  TransferWithinAStation as TransferIcon
} from '@mui/icons-material';
import { getAssignableEmployees, transferTask } from '../../services/api';

const TaskTransferModal = ({ open, onClose, task, onTransferSuccess }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open && task && task.project_id && task.team_id) {
      fetchAssignableEmployees();
    } else {
      setEmployees([]);
      setSelectedEmployee('');
      setError('');
      setSuccess('');
    }
  }, [open, task]);

  const fetchAssignableEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAssignableEmployees({
        project_id: task.project_id,
        team_id: task.team_id
      });
      
      if (response && response.success && Array.isArray(response.data)) {
        // Exclude the current assignee
        const currentAssigneeId = task.assigned_to || task.assigned_to_id;
        console.log('Current assignee ID:', currentAssigneeId);
        console.log('All employees:', response.data);
        
        const filtered = response.data.filter(emp => {
          const employeeId = emp.employee_id || emp.id;
          return String(employeeId) !== String(currentAssigneeId);
        });
        
        console.log('Filtered employees:', filtered);
        setEmployees(filtered);
        setSelectedEmployee(filtered.length > 0 ? filtered[0].employee_id || filtered[0].id : '');
      } else {
        setEmployees([]);
        setError('No eligible employees found in this team.');
      }
    } catch (err) {
      setError('Failed to fetch employees. Please try again.');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedEmployee) {
      setError('Please select an employee to transfer the task to.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await transferTask(task.track_entry_id || task.id, selectedEmployee);
      setSuccess('Task transferred successfully!');
      if (onTransferSuccess) onTransferSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to transfer task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCurrentAssigneeName = () => {
    if (!task) return '';
    return task.assigned_to_name || `Employee #${task.assigned_to}`;
  };

  const getSelectedEmployeeName = () => {
    if (!selectedEmployee) return '';
    const employee = employees.find(emp => emp.employee_id === selectedEmployee);
    return employee ? 
      (employee.full_name || `${employee.first_name} ${employee.last_name}`) : 
      '';
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        py: 1.5,
        px: 3,
      }}>
        <Box display="flex" alignItems="center">
          <TransferIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Transfer Task</Typography>
        </Box>
        <IconButton 
          onClick={onClose} 
          disabled={submitting}
          sx={{ color: 'inherit' }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Current Task Info */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            TASK DETAILS
          </Typography>
          <Typography variant="h6" noWrap sx={{ mb: 1 }}>
            {task?.title || 'No title'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Current Assignee: <strong>{getCurrentAssigneeName()}</strong>
          </Typography>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress />
          </Box>
        ) : (
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel id="employee-select-label">Select New Assignee</InputLabel>
            <Select
              labelId="employee-select-label"
              id="employee-select"
              value={selectedEmployee}
              onChange={e => setSelectedEmployee(e.target.value)}
              disabled={submitting || employees.length === 0}
              label="Select New Assignee"
              renderValue={(selected) => {
                if (!selected) return <em>Select an employee</em>;
                const employee = employees.find(emp => emp.employee_id === selected);
                return employee ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}>
                      <PersonIcon fontSize="small" />
                    </Avatar>
                    {employee.full_name || `${employee.first_name} ${employee.last_name}`}
                  </Box>
                ) : null;
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                  },
                },
              }}
            >
              {employees.length === 0 ? (
                <MenuItem disabled>No eligible employees</MenuItem>
              ) : (
                employees.map(emp => (
                  <MenuItem key={emp.employee_id} value={emp.employee_id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={emp.full_name || `${emp.first_name} ${emp.last_name}`}
                      secondary={emp.role || 'Employee'}
                    />
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        )}

        {/* Transfer Preview */}
        {selectedEmployee && !loading && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 1, color: 'white' }}>
            <Typography variant="subtitle2" gutterBottom>
              Transfer Preview
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2">
                  From: <strong>{getCurrentAssigneeName()}</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  To: <strong>{getSelectedEmployeeName()}</strong>
                </Typography>
              </Box>
              <TransferIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button 
          onClick={onClose} 
          disabled={submitting}
          variant="outlined"
          color="inherit"
          sx={{ mr: 1 }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleTransfer} 
          color="primary" 
          variant="contained"
          disabled={submitting || loading || employees.length === 0}
          startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <TransferIcon />}
        >
          {submitting ? 'Transferring...' : 'Confirm Transfer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskTransferModal;
