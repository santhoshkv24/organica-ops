import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  FormHelperText,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Add, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { createInventoryLoan, getProjects } from '../../services/api';

const InventoryLoanForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [formData, setFormData] = useState({
    project_id: '',
    responsible_team_id: 5, // Hardware team ID
    expected_return_date: null,
    purpose: '',
    items: [{ item_name: '', quantity_requested: 1 }]
  });

  const [formErrors, setFormErrors] = useState({
    project_id: '',
    expected_return_date: '',
    purpose: '',
    items: []
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const res = await getProjects();
      setProjects(res.data.data || res.data || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects. Please try again.");
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is updated
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      expected_return_date: date
    }));
    
    // Clear error when date is updated
    if (formErrors.expected_return_date) {
      setFormErrors(prev => ({
        ...prev,
        expected_return_date: ''
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
    
    // Clear error for this item if exists
    if (formErrors.items && formErrors.items[index] && formErrors.items[index][field]) {
      const updatedItemErrors = [...formErrors.items];
      updatedItemErrors[index] = {
        ...updatedItemErrors[index],
        [field]: ''
      };
      
      setFormErrors(prev => ({
        ...prev,
        items: updatedItemErrors
      }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { item_name: '', quantity_requested: 1 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) {
      return; // Keep at least one item
    }
    
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      project_id: '',
      expected_return_date: '',
      purpose: '',
      items: formData.items.map(() => ({ item_name: '', quantity_requested: '' }))
    };

    // Validate required fields
    if (!formData.project_id) {
      newErrors.project_id = 'Project is required';
      valid = false;
    }

    if (!formData.expected_return_date) {
      newErrors.expected_return_date = 'Expected return date is required';
      valid = false;
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const returnDate = new Date(formData.expected_return_date);
      returnDate.setHours(0, 0, 0, 0);
      
      if (returnDate <= today) {
        newErrors.expected_return_date = 'Return date must be in the future';
        valid = false;
      }
    }

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
      valid = false;
    }

    // Validate items
    formData.items.forEach((item, index) => {
      if (!item.item_name.trim()) {
        newErrors.items[index].item_name = 'Item name is required';
        valid = false;
      }
      
      if (!item.quantity_requested || item.quantity_requested < 1) {
        newErrors.items[index].quantity_requested = 'Quantity must be at least 1';
        valid = false;
      }
    });

    setFormErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Format the data for API
      const apiData = {
        ...formData,
        expected_return_date: formData.expected_return_date.toISOString().split('T')[0],
      };
      
      await createInventoryLoan(apiData);
      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/inventory-loans');
      }, 2000);
      
    } catch (err) {
      console.error("Error creating inventory loan:", err);
      setError(err.response?.data?.message || "Failed to create inventory loan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Request Inventory Loan
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Inventory loan request submitted successfully!
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Card sx={{ mb: 4 }}>
            <CardHeader title="Loan Details" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!formErrors.project_id}>
                    <InputLabel id="project-label">Project *</InputLabel>
                    <Select
                      labelId="project-label"
                      id="project_id"
                      name="project_id"
                      value={formData.project_id}
                      onChange={handleChange}
                      label="Project *"
                      disabled={loading || loadingProjects}
                    >
                      {loadingProjects ? (
                        <MenuItem disabled>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Loading projects...
                        </MenuItem>
                      ) : (
                        projects.map((project) => (
                          <MenuItem key={project.project_id} value={project.project_id}>
                            {project.name}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    {formErrors.project_id && <FormHelperText>{formErrors.project_id}</FormHelperText>}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Expected Return Date *"
                    value={formData.expected_return_date}
                    onChange={handleDateChange}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth 
                        error={!!formErrors.expected_return_date}
                        helperText={formErrors.expected_return_date}
                      />
                    )}
                    disablePast
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    id="purpose"
                    name="purpose"
                    label="Purpose *"
                    multiline
                    rows={3}
                    value={formData.purpose}
                    onChange={handleChange}
                    fullWidth
                    error={!!formErrors.purpose}
                    helperText={formErrors.purpose}
                    disabled={loading}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          <Card sx={{ mb: 4 }}>
            <CardHeader 
              title="Requested Items" 
              action={
                <Button
                  startIcon={<Add />}
                  onClick={addItem}
                  disabled={loading}
                >
                  Add Item
                </Button>
              }
            />
            <CardContent>
              {formData.items.map((item, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  {index > 0 && <Divider sx={{ my: 2 }} />}
                  
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Item Name *"
                        value={item.item_name}
                        onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                        fullWidth
                        error={formErrors.items?.[index]?.item_name}
                        helperText={formErrors.items?.[index]?.item_name}
                        disabled={loading}
                      />
                    </Grid>
                    
                    <Grid item xs={8} md={4}>
                      <TextField
                        label="Quantity *"
                        type="number"
                        value={item.quantity_requested}
                        onChange={(e) => handleItemChange(index, 'quantity_requested', parseInt(e.target.value) || '')}
                        fullWidth
                        inputProps={{ min: 1 }}
                        error={formErrors.items?.[index]?.quantity_requested}
                        helperText={formErrors.items?.[index]?.quantity_requested}
                        disabled={loading}
                      />
                    </Grid>
                    
                    <Grid item xs={4} md={2}>
                      <IconButton 
                        color="error" 
                        onClick={() => removeItem(index)}
                        disabled={formData.items.length === 1 || loading}
                      >
                        <Delete />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </CardContent>
          </Card>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/inventory-loans')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </Box>
        </form>
      </Box>
    </LocalizationProvider>
  );
};

export default InventoryLoanForm;