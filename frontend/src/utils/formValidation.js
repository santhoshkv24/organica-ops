/**
 * Form validation utilities for the C2C Portal application
 */

// Validate a form against a schema
export const validateForm = (values, schema) => {
  const errors = {};
  if (!schema) return errors;

  Object.keys(schema).forEach(field => {
    const value = values[field];
    const fieldSchema = schema[field];

    // Check required fields
    if (fieldSchema.required && (value === undefined || value === null || value === '')) {
      errors[field] = fieldSchema.requiredMessage || `${fieldSchema.label || field} is required`;
      return;
    }

    // Skip validation for empty optional fields
    if (value === undefined || value === null || value === '') {
      return;
    }

    // Check field types
    if (fieldSchema.type === 'email' && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
      errors[field] = fieldSchema.typeMessage || 'Invalid email address';
    } else if (fieldSchema.type === 'url' && !/^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)$/i.test(value)) {
      errors[field] = fieldSchema.typeMessage || 'Invalid URL';
    } else if (fieldSchema.type === 'phone' && !/^\+?[0-9\s-()]{7,}$/.test(value)) {
      errors[field] = fieldSchema.typeMessage || 'Invalid phone number';
    }

    // Check min length
    if (fieldSchema.minLength !== undefined && value.length < fieldSchema.minLength) {
      errors[field] = fieldSchema.minLengthMessage || `Must be at least ${fieldSchema.minLength} characters`;
    }

    // Check max length
    if (fieldSchema.maxLength !== undefined && value.length > fieldSchema.maxLength) {
      errors[field] = fieldSchema.maxLengthMessage || `Must be at most ${fieldSchema.maxLength} characters`;
    }

    // Check min value
    if (fieldSchema.min !== undefined && parseFloat(value) < fieldSchema.min) {
      errors[field] = fieldSchema.minMessage || `Must be greater than or equal to ${fieldSchema.min}`;
    }

    // Check max value
    if (fieldSchema.max !== undefined && parseFloat(value) > fieldSchema.max) {
      errors[field] = fieldSchema.maxMessage || `Must be less than or equal to ${fieldSchema.max}`;
    }

    // Check pattern
    if (fieldSchema.pattern && !new RegExp(fieldSchema.pattern).test(value)) {
      errors[field] = fieldSchema.patternMessage || 'Invalid format';
    }

    // Check custom validation
    if (fieldSchema.validate && typeof fieldSchema.validate === 'function') {
      const customError = fieldSchema.validate(value, values);
      if (customError) {
        errors[field] = customError;
      }
    }
  });

  return errors;
};

// Validation schemas for different entity types
export const validationSchemas = {
  // Company schema
  company: {
    name: {
      label: 'Branch Name',
      required: true,
      minLength: 2,
      maxLength: 100
    },
    address: {
      label: 'Address',
      maxLength: 200
    },
    contact_email: {
      label: 'Contact Email',
      type: 'email',
      maxLength: 100
    },
    contact_phone: {
      label: 'Contact Phone',
      type: 'phone',
      maxLength: 20
    }
  },

  // Department schema
  department: {
    name: {
      label: 'Department Name',
      required: true,
      minLength: 2,
      maxLength: 100
    },
    company_id: {
      label: 'Company',
      required: true
    },
    description: {
      label: 'Description',
      maxLength: 500
    },
    manager_name: {
      label: 'Manager Name',
      maxLength: 100
    },
    location: {
      label: 'Location',
      maxLength: 100
    }
  },

  // Team schema
  team: {
    name: {
      label: 'Team Name',
      required: true,
      minLength: 2,
      maxLength: 100
    },
    branch_id: {
      label: 'Branch',
      required: true
    },
    description: {
      label: 'Description',
      maxLength: 500
    },
    team_lead_name: {
      label: 'Team Lead Name',
      maxLength: 100
    },
    location: {
      label: 'Location',
      maxLength: 100
    }
  },

  // Employee schema
  employee: {
    first_name: {
      label: 'First Name',
      required: true,
      minLength: 2,
      maxLength: 50
    },
    last_name: {
      label: 'Last Name',
      required: true,
      minLength: 2,
      maxLength: 50
    },
    email: {
      label: 'Email',
      required: true,
      type: 'email',
      maxLength: 100
    },
    phone: {
      label: 'Phone',
      type: 'phone',
      maxLength: 20
    },
    position: {
      label: 'Position',
      required: true,
      maxLength: 100
    },
    team_id: {
      label: 'Team',
      required: false
    },
    branch_id: {
      label: 'Branch',
      required: false
    },
    hire_date: {
      label: 'Hire Date',
      type: 'date'
    },
    address: {
      label: 'Address',
      maxLength: 200
    },
    status: {
      label: 'Status'
    }
  },

  // Project schema
  project: {
    name: {
      label: 'Project Name',
      required: true,
      minLength: 2,
      maxLength: 100
    },
    branch_id: {
      label: 'Branch',
      required: true
    },
    team_id: {
      label: 'Team',
      required: true
    },
    description: {
      label: 'Description',
      maxLength: 500
    },
    status: {
      label: 'Status',
      required: true
    },
    start_date: {
      label: 'Start Date',
      type: 'date'
    },
    end_date: {
      label: 'End Date',
      type: 'date'
    },
    project_manager_id: {
      label: 'Project Manager',
      required: true
    }
  },

  // Meeting schema
  meeting: {
    title: {
      label: 'Meeting Title',
      required: true,
      minLength: 2,
      maxLength: 100
    },
    description: {
      label: 'Description',
      maxLength: 500
    },
    team_id: {
      label: 'Team',
      required: false
    },
    project_id: {
      label: 'Project',
      required: false
    },
    start_datetime: {
      label: 'Start Date & Time',
      required: true,
      type: 'datetime'
    },
    end_datetime: {
      label: 'End Date & Time',
      required: true,
      type: 'datetime'
    },
    location_or_link: {
      label: 'Location/Link',
      required: true,
      maxLength: 255
    },
    participants: {
      label: 'Participants',
      type: 'array'
    }
  },

  // Track Entry schema
  trackEntry: {
    project_id: {
      label: 'Project',
      required: true
    },
    team_id: {
      label: 'Team',
      required: false
    },
    assigned_to: {
      label: 'Assigned To',
      required: true
    },
    title: {
      label: 'Task Title',
      required: true,
      minLength: 2,
      maxLength: 100
    },
    description: {
      label: 'Description',
      maxLength: 500
    },
    status: {
      label: 'Status',
      required: true
    },
    due_date: {
      label: 'Due Date',
      type: 'date'
    },
    estimated_hours: {
      label: 'Estimated Hours',
      type: 'number',
      min: 0
    },
    hours_spent: {
      label: 'Hours Spent',
      type: 'number',
      min: 0
    }
  },

  // Customer Company schema
  customerCompany: {
    name: {
      label: 'Company Name',
      required: true,
      minLength: 2,
      maxLength: 100
    },
    industry: {
      label: 'Industry',
      maxLength: 50
    },
    website: {
      label: 'Website',
      type: 'url',
      maxLength: 100
    },
    address: {
      label: 'Address',
      maxLength: 200
    },
    contact_email: {
      label: 'Contact Email',
      type: 'email',
      maxLength: 100
    },
    contact_phone: {
      label: 'Contact Phone',
      type: 'phone',
      maxLength: 20
    }
  },

  // Customer Detail (Contact) schema
  customerDetail: {
    first_name: {
      label: 'First Name',
      required: true,
      minLength: 2,
      maxLength: 50
    },
    last_name: {
      label: 'Last Name',
      required: true,
      minLength: 2,
      maxLength: 50
    },
    email: {
      label: 'Email',
      required: true,
      type: 'email',
      maxLength: 100
    },
    phone: {
      label: 'Phone',
      type: 'phone',
      maxLength: 20
    },
    position: {
      label: 'Position',
      maxLength: 100
    },
    customer_company_id: {
      label: 'Company'
    }
  },

  // User schema
  user: {
    first_name: {
      label: 'First Name',
      required: true,
      minLength: 2,
      maxLength: 50
    },
    last_name: {
      label: 'Last Name',
      required: true,
      minLength: 2,
      maxLength: 50
    },
    username: {
      label: 'Username',
      required: true,
      minLength: 3,
      maxLength: 30
    },
    email: {
      label: 'Email',
      required: true,
      type: 'email',
      maxLength: 100
    },
    password: {
      label: 'Password',
      required: true,
      minLength: 8,
      maxLength: 100
    },
    role: {
      label: 'Role',
      required: true
    },
    phone: {
      label: 'Phone',
      type: 'phone',
      maxLength: 20
    },
    is_active: {
      label: 'Active Status'
    }
  },

  // Settings schema (for reference - not used directly with the form components)
  settings: {
    siteName: {
      label: 'Site Name',
      required: true,
      minLength: 2,
      maxLength: 100
    },
    siteDescription: {
      label: 'Site Description',
      maxLength: 500
    },
    contactEmail: {
      label: 'Contact Email',
      type: 'email',
      maxLength: 100
    },
    smtpServer: {
      label: 'SMTP Server',
      required: true,
      maxLength: 100
    },
    smtpPort: {
      label: 'SMTP Port',
      required: true,
      min: 1,
      max: 65535
    },
    smtpUsername: {
      label: 'SMTP Username',
      maxLength: 100
    },
    smtpPassword: {
      label: 'SMTP Password',
      maxLength: 100
    },
    senderEmail: {
      label: 'Sender Email',
      required: true,
      type: 'email',
      maxLength: 100
    },
    senderName: {
      label: 'Sender Name',
      required: true,
      maxLength: 100
    }
  }
};

// Helper function to generate default values from a schema
export const getDefaultValues = (schema) => {
  if (!schema) return {};
  
  const defaultValues = {};
  Object.keys(schema).forEach(field => {
    const fieldSchema = schema[field];
    if (fieldSchema.defaultValue !== undefined) {
      defaultValues[field] = fieldSchema.defaultValue;
    } else if (fieldSchema.type === 'checkbox' || fieldSchema.type === 'switch') {
      defaultValues[field] = false;
    } else {
      defaultValues[field] = '';
    }
  });
  
  return defaultValues;
}; 