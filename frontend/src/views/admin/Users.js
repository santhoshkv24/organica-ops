import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CCard, CCardBody, CSpinner, CAlert } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilUser, cilEnvelopeClosed, cilPhone, cilShieldAlt, cilCalendar } from '@coreui/icons';
import FormGrid from '../../components/FormGrid';
import { validateForm, validationSchemas } from '../../utils/formValidation';
import { validateUserForm, processUserFormValues } from '../../middleware/validationMiddleware';
import { useAuth } from '../../contexts/AuthContext';
import { getUsers, createUser, updateUser, deleteUser } from '../../services/api';

const roleOptions = [
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Manager' },
  { value: 'employee', label: 'Employee' },
  { value: 'customer', label: 'Customer' }
];

const Users = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Verify user is admin or manager
  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'manager') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Define form fields for user management
  const formFields = [
    {
      name: 'username',
      label: 'Username',
      type: 'text',
      required: true,
      placeholder: 'Enter username'
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'Enter email address'
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'Enter password',
      required: (_, formMode) => formMode === 'create', // Only required for new users
      tooltip: 'Leave blank to keep current password when editing'
    },
    {
      name: 'confirm_password',
      label: 'Confirm Password',
      type: 'password',
      placeholder: 'Confirm password',
      required: (values) => !!values.password, // Only required if password is filled
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      placeholder: 'Select role',
      options: roleOptions,
      defaultValue: 'employee'
    }
  ];

  // Define grid columns for users list
  const gridColumns = [
    { 
      key: 'user_info', 
      label: 'User',
      sortable: false,
      render: (value, row) => (
        <div className="d-flex align-items-center">
          <div className="bg-light p-2 rounded-circle me-3">
            <CIcon icon={cilUser} size="lg" />
          </div>
          <div>
            <div className="fw-bold">{row.username}</div>
            <small className="text-muted">{row.email}</small>
          </div>
        </div>
      )
    },
    { 
      key: 'email', 
      label: 'Email',
      sortable: true,
      render: (value) => (
        <div className="d-flex align-items-center">
          <CIcon icon={cilEnvelopeClosed} className="me-2 text-muted" size="sm" />
          <a href={`mailto:${value}`}>{value}</a>
        </div>
      )
    },
    { 
      key: 'role', 
      label: 'Role',
      sortable: true,
      render: (value) => {
        let color;
        switch(value) {
          case 'admin': color = 'danger'; break;
          case 'manager': color = 'warning'; break;
          case 'employee': color = 'info'; break;
          case 'customer': color = 'success'; break;
          default: color = 'secondary';
        }
        
        return (
          <div className="d-flex align-items-center">
            <CIcon icon={cilShieldAlt} className="me-2 text-muted" size="sm" />
            <span className={`badge bg-${color}`}>
              {value === 'admin' ? 'Administrator' : 
               value === 'manager' ? 'Manager' :
               value === 'employee' ? 'Employee' : 
               value === 'customer' ? 'Customer' : 
               value}
            </span>
          </div>
        );
      }
    },
    {
      key: 'created_at',
      label: 'Created At',
      sortable: true,
      render: (value) => (
        <div className="d-flex align-items-center">
          <CIcon icon={cilCalendar} className="me-2 text-muted" size="sm" />
          {new Date(value).toLocaleDateString()}
        </div>
      )
    }
  ];

  // Fetch users from API
  const fetchUsers = async (searchParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query params from search fields
      const queryParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await getUsers(queryParams.toString());
      console.log('Users response:', response);
      setUsers(response.data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle creating a new user
  const handleCreateUser = async (values) => {
    try {
      console.log('Creating user with values:', values);
      
      // Process values before sending to API
      const userData = processUserFormValues(values, 'create');
      
      const result = await createUser(userData);
      console.log('Create user result:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create user');
      }
      
      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error(error.message || "Failed to create user");
    }
  };

  // Handle updating a user
  const handleUpdateUser = async (user, values) => {
    try {
      console.log('Updating user with values:', values);
      
      // Process values before sending to API
      const userData = processUserFormValues(values, 'edit');
      const { user_id, ...userDataWithoutId } = userData;

      const result = await updateUser(user.user_id, userData);
      console.log('Update user result:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update user');
      }
      
      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Error updating user:", error);
      throw new Error(error.message || "Failed to update user");
    }
  };

  // Handle deleting a user
  const handleDeleteUser = async (user) => {
    try {
      await deleteUser(user.user_id);
      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new Error(error.message || "Failed to delete user");
    }
  };

  // Show warning if no users
  if (users.length === 0 && !loading && !error) {
    return (
      <CAlert color="warning">
        <h4>No users found</h4>
        <p>There are no users in the system. Please create an admin user to get started.</p>
      </CAlert>
    );
  }

  // Show loading spinner while data is loading
  if (loading && !users.length) {
    return (
      <CCard className="mb-4">
        <CCardBody className="text-center p-5">
          <CSpinner color="primary" />
          <div className="mt-3">Loading users...</div>
        </CCardBody>
      </CCard>
    );
  }

  return (
    <FormGrid
      title="Users"
      data={users}
      columns={gridColumns}
      formFields={formFields}
      formTitle="User Information"
      loading={loading}
      onFetchData={fetchUsers}
      onCreate={handleCreateUser}
      onUpdate={handleUpdateUser}
      onDelete={handleDeleteUser}
      validateForm={validateUserForm}
      processBeforeSave={processUserFormValues}
      enableCreate={true}
      enableEdit={true}
      enableDelete={(userToDelete) => userToDelete.user_id !== user.user_id} // Prevent deleting yourself
      formPosition="modal"
      showSearchForm={true}
      confirmDelete={true}
      deleteMessage="Are you sure you want to delete this user? This action cannot be undone."
    />
  );
};

export default Users; 