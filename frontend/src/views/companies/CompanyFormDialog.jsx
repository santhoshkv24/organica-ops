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
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { createCompany, updateCompany } from '../../services/api';

const CompanyFormDialog = ({ open, onClose, company, mode, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact_email: '',
    contact_phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  // Initialize form data when dialog opens or company changes
  useEffect(() => {
    if (open) {
      if (company && (isEditMode || isViewMode)) {
        setFormData({
          name: company.name || '',
          address: company.address || '',
          contact_email: company.contact_email || '',
          contact_phone: company.contact_phone || ''
        });
      } else if (isCreateMode) {
        setFormData({
          name: '',
          address: '',
          contact_email: '',
          contact_phone: ''
        });
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [open, company, mode]);

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Division name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Division name must be less than 100 characters';
    }

    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }

    if (formData.contact_phone && formData.contact_phone.length > 20) {
      newErrors.contact_phone = 'Phone number must be less than 20 characters';
    }

    if (formData.address && formData.address.length > 500) {
      newErrors.address = 'Address must be less than 500 characters';
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
      if (isCreateMode) {
        await createCompany(formData);
      } else if (isEditMode) {
        const branchId = company.branch_id || company.company_id;
        if (!branchId) {
          throw new Error('Invalid company ID');
        }
        await updateCompany(branchId, formData);
      }
      
      if (onSubmit) {
        onSubmit();
      }
      onClose();
    } catch (error) {
      console.error('Error saving company:', error);
      setSubmitError(error.message || 'Failed to save division. Please try again.');
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
      case 'create': return 'Add New Division';
      case 'edit': return 'Edit Division';
      case 'view': return 'Division Details';
      default: return 'Division';
    }
  };

  const getSubmitButtonText = () => {
    if (loading) return isCreateMode ? 'Creating...' : 'Updating...';
    return isCreateMode ? 'Create Division' : 'Update Division';
  };

  return (
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
          <BusinessIcon color="primary" />
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
        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        <Grid container spacing={3}>
            <TextField
              fullWidth
              label="Division Name"
              value={formData.name}
              onChange={handleInputChange('name')}
              error={!!errors.name}
              helperText={errors.name}
              disabled={isViewMode || loading}
              required
              variant="outlined"
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon color="action" />
                  </InputAdornment>
                ),
              }}
              placeholder="Enter division name"
              sx={{ mb: 1 }}
            />

            <TextField
              fullWidth
              label="Address"
              value={formData.address}
              onChange={handleInputChange('address')}
              error={!!errors.address}
              helperText={errors.address}
              disabled={isViewMode || loading}
              multiline
              rows={3}
              variant="outlined"
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                    <LocationIcon color="action" />
                  </InputAdornment>
                ),
              }}
              placeholder="Enter company address"
              sx={{ mb: 1 }}
            />

            <TextField
              fullWidth
              label="Contact Email"
              type="email"
              value={formData.contact_email}
              onChange={handleInputChange('contact_email')}
              error={!!errors.contact_email}
              helperText={errors.contact_email}
              disabled={isViewMode || loading}
              variant="outlined"
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
              placeholder="contact@company.com"
              sx={{ mb: 1 }}
            />

            <TextField
              fullWidth
              label="Contact Phone"
              value={formData.contact_phone}
              onChange={handleInputChange('contact_phone')}
              error={!!errors.contact_phone}
              helperText={errors.contact_phone}
              disabled={isViewMode || loading}
              variant="outlined"
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon color="action" />
                  </InputAdornment>
                ),
              }}
              placeholder="+1 (555) 123-4567"
              sx={{ mb: 1 }}
            />

          {isViewMode && company && (
            <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
                  Additional Information
                </Typography>
              
              {company.created_at && (
                  <TextField
                    fullWidth
                    label="Created Date"
                    value={new Date(company.created_at).toLocaleDateString()}
                    disabled
                    variant="outlined"
                    size="medium"
                    sx={{ mb: 1 }}
                  />
              )}

              {company.updated_at && (
                  <TextField
                    fullWidth
                    label="Last Updated"
                    value={new Date(company.updated_at).toLocaleDateString()}
                    disabled
                    variant="outlined"
                    size="medium"
                    sx={{ mb: 1 }}
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
            disabled={loading}
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
            sx={{ minWidth: 140 }}
          >
            {getSubmitButtonText()}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CompanyFormDialog;
