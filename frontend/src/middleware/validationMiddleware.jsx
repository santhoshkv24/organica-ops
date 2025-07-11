import React from 'react';

/**
 * Form validation middleware for frontend components
 */

// Validate user form
export const validateUserForm = (values, formMode) => {
  const errors = {};
  
  // Required fields
  if (!values.username) errors.username = 'Username is required';
  if (!values.email) errors.email = 'Email is required';
  
  // Role validation
  if (!values.role) {
    errors.role = 'Role is required';
  } else if (!['admin', 'manager', 'employee', 'customer'].includes(values.role)) {
    errors.role = 'Role must be one of: admin, manager, employee, customer';
  }
  
  // Password validation
  if (formMode === 'create' && !values.password) {
    errors.password = 'Password is required for new users';
  }
  
  if (values.password && values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  
  // Confirm password validation
  if (values.password && values.password !== values.confirm_password) {
    errors.confirm_password = 'Passwords do not match';
  }
  
  // Email format validation
  if (values.email && !/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  return errors;
};

// Process form values before save
export const processUserFormValues = (values, formMode) => {
  // Remove confirm_password
  const { confirm_password, ...processedValues } = values;
  
  // If editing and password is empty, remove it
  if (formMode === 'edit' && !processedValues.password) {
    delete processedValues.password;
  }
  
  return processedValues;
};

export default {
  validateUserForm,
  processUserFormValues
}; 