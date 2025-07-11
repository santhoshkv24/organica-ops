import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Grid,
  InputAdornment,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import {
  Close as CloseIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  DateRange as DateIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  Flag as FlagIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  createProject,
  updateProject,
  getCustomerCompanies,
  getEmployees,
  getUsers
} from '../../services/api';

// Project status constants
export const PROJECT_STATUS = {
  PLANNING: 'planning',
  IN_PROGRESS: 'in_progress',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const STATUS_OPTIONS = [
  { value: PROJECT_STATUS.PLANNING, label: 'Planning', color: 'default' },
  { value: PROJECT_STATUS.IN_PROGRESS, label: 'In Progress', color: 'primary' },
  { value: PROJECT_STATUS.ON_HOLD, label: 'On Hold', color: 'warning' },
  { value: PROJECT_STATUS.COMPLETED, label: 'Completed', color: 'success' },
  { value: PROJECT_STATUS.CANCELLED, label: 'Cancelled', color: 'error' },
];

const ProjectFormDialog = ({ open, onClose, project, mode, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    customer_company_id: '',
    project_manager_id: '',
    status: PROJECT_STATUS.PLANNING,
    start_date: null,
    end_date: null,
    description: '',
    budget: ''
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  // Data for dropdowns
  const [customerCompanies, setCustomerCompanies] = useState([]);
  const [managers, setManagers] = useState([]);

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  // Load dropdown data when dialog opens
  useEffect(() => {
    if (open) {
      loadDropdownData();
    }
  }, [open]);

  // Initialize form data when dialog opens or project changes
  useEffect(() => {
    if (open) {
      if (project && (isEditMode || isViewMode)) {
        setFormData({
          name: project.name || '',
          customer_company_id: project.customer_company_id || '',
          project_manager_id: project.project_manager_id || '',
          status: project.status || PROJECT_STATUS.PLANNING,
          start_date: project.start_date ? new Date(project.start_date) : null,
          end_date: project.end_date ? new Date(project.end_date) : null,
          description: project.description || '',
          budget: project.budget !== null && project.budget !== undefined ? project.budget.toString() : ''
        });
      } else if (isCreateMode) {
        setFormData({
          name: '',
          customer_company_id: '',
          project_manager_id: '',
          status: PROJECT_STATUS.PLANNING,
          start_date: null,
          end_date: null,
          description: '',
          budget: ''
        });
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [open, project, mode]);

  const loadDropdownData = async () => {
    try {
      setDataLoading(true);
      const [customerCompaniesRes, employeesRes, usersRes] = await Promise.all([
        getCustomerCompanies(),
        getEmployees(),
        getUsers()
      ]);

      // Process customer companies
      const customerCompaniesData = customerCompaniesRes?.data?.data || customerCompaniesRes?.data || [];
      setCustomerCompanies(customerCompaniesData);

      // Process employees and users to get managers
      const employeesData = employeesRes?.data?.data || employeesRes?.data || [];
      const usersData = usersRes?.data?.data || usersRes?.data || [];

      // Filter employees who are managers or admins
      const managersList = employeesData
        .filter(emp => {
          const userEntry = usersData.find(u => u.employee_id === emp.employee_id);
          return userEntry && ['admin', 'manager'].includes(userEntry.role);
        })
        .map(emp => ({
          value: emp.employee_id,
          label: `${emp.first_name} ${emp.last_name} (${emp.position})`
        }));

      setManagers(managersList);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      setSubmitError('Failed to load form data. Please try again.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleDateChange = (field) => (date) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Project name must be less than 255 characters';
    }

    if (!formData.customer_company_id) {
      newErrors.customer_company_id = 'Customer company is required';
    }

    if (!formData.project_manager_id) {
      newErrors.project_manager_id = 'Project manager is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = 'End date must be after start date';
    }

    if (formData.budget && (isNaN(formData.budget) || parseFloat(formData.budget) < 0)) {
      newErrors.budget = 'Budget must be a valid positive number';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const dataToSubmit = {
        name: formData.name.trim(),
        customer_company_id: parseInt(formData.customer_company_id, 10),
        project_manager_id: parseInt(formData.project_manager_id, 10),
        status: formData.status,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        description: formData.description.trim() || '',
        budget: formData.budget !== '' ? parseFloat(formData.budget) : null
      };

      if (isCreateMode) {
        await createProject(dataToSubmit);
      } else if (isEditMode) {
        await updateProject(project.project_id, dataToSubmit);
      }
      
      if (onSubmit) {
        onSubmit();
      }
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
      setSubmitError(error.message || 'Failed to save project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const getDialogTitle = () => {
    switch (mode) {
      case 'create': return 'Create New Project';
      case 'edit': return 'Edit Project';
      case 'view': return 'Project Details';
      default: return 'Project';
    }
  };

  const getSubmitButtonText = () => {
    if (loading) return isCreateMode ? 'Creating...' : 'Updating...';
    return isCreateMode ? 'Create Project' : 'Update Project';
  };

  const getStatusColor = (status) => {
    const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
    return statusOption?.color || 'default';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
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
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WorkIcon color="primary" />
            <Typography variant="h6" component="div">
              {getDialogTitle()}
            </Typography>
            {isViewMode && (
              <Chip
                label="Read Only"
                size="small"
                color="info"
                variant="outlined"
              />
            )}
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
          {(submitError || dataLoading) && (
            <Box sx={{ mb: 3 }}>
              {submitError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {submitError}
                </Alert>
              )}
              {dataLoading && (
                <Alert severity="info" icon={<CircularProgress size={16} />}>
                  Loading form data...
                </Alert>
              )}
            </Box>
          )}

          <Grid container spacing={3}>
              <TextField
                fullWidth
                label="Project Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                disabled={isViewMode || loading}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <WorkIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                placeholder="Enter project name"
              />

              <FormControl
                fullWidth
                error={!!errors.customer_company_id}
                disabled={isViewMode || loading || dataLoading}
                required
              >
                <InputLabel>Customer Company</InputLabel>
                <Select
                  value={formData.customer_company_id}
                  onChange={handleInputChange('customer_company_id')}
                  label="Customer Company"
                  startAdornment={
                    <InputAdornment position="start">
                      <BusinessIcon color="action" />
                    </InputAdornment>
                  }
                >
                  {customerCompanies.map(company => (
                    <MenuItem key={company.customer_company_id} value={company.customer_company_id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.customer_company_id && (
                  <FormHelperText>{errors.customer_company_id}</FormHelperText>
                )}
              </FormControl>
            

              <FormControl
                fullWidth
                error={!!errors.project_manager_id}
                disabled={isViewMode || loading || dataLoading}
                required
              >
                <InputLabel>Project Manager</InputLabel>
                <Select
                  value={formData.project_manager_id}
                  onChange={handleInputChange('project_manager_id')}
                  label="Project Manager"
                  startAdornment={
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  }
                >
                  {managers.map(manager => (
                    <MenuItem key={manager.value} value={manager.value}>
                      {manager.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.project_manager_id && (
                  <FormHelperText>{errors.project_manager_id}</FormHelperText>
                )}
              </FormControl>

              <FormControl
                fullWidth
                error={!!errors.status}
                disabled={isViewMode || loading}
                required
              >
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={handleInputChange('status')}
                  label="Status"
                  startAdornment={
                    <InputAdornment position="start">
                      <FlagIcon color="action" />
                    </InputAdornment>
                  }
                >
                  {STATUS_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={option.label}
                          size="small"
                          color={option.color}
                          variant="outlined"
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.status && (
                  <FormHelperText>{errors.status}</FormHelperText>
                )}
              </FormControl>

              <TextField
                fullWidth
                label="Budget"
                type="number"
                value={formData.budget}
                onChange={handleInputChange('budget')}
                error={!!errors.budget}
                helperText={errors.budget}
                disabled={isViewMode || loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MoneyIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                placeholder="0.00"
                inputProps={{ step: "0.01", min: "0" }}
              />

              <DatePicker
                label="Start Date"
                value={formData.start_date}
                onChange={handleDateChange('start_date')}
                disabled={isViewMode || loading}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.start_date,
                    helperText: errors.start_date,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <DateIcon color="action" />
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />

              <DatePicker
                label="End Date"
                value={formData.end_date}
                onChange={handleDateChange('end_date')}
                disabled={isViewMode || loading}
                minDate={formData.start_date}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.end_date,
                    helperText: errors.end_date,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <DateIcon color="action" />
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleInputChange('description')}
                error={!!errors.description}
                helperText={errors.description}
                disabled={isViewMode || loading}
                multiline
                rows={4}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                      <DescriptionIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                placeholder="Enter project description"
              />

            {isViewMode && project && (
              <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Additional Information
                  </Typography>
                
                {project.created_at && (
                    <TextField
                      fullWidth
                      label="Created Date"
                      value={new Date(project.created_at).toLocaleDateString()}
                      disabled
                      variant="outlined"
                    />
                )}

                {project.updated_at && (
                    <TextField
                      fullWidth
                      label="Last Updated"
                      value={new Date(project.updated_at).toLocaleDateString()}
                      disabled
                      variant="outlined"
                    />
  
                )}
              </>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            startIcon={<CancelIcon />}
            color="inherit"
          >
            {isViewMode ? 'Close' : 'Cancel'}
          </Button>
          
          {!isViewMode && (
            <Button
              onClick={handleSubmit}
              disabled={loading || dataLoading}
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
              sx={{ minWidth: 140 }}
            >
              {getSubmitButtonText()}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ProjectFormDialog;
