import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CCard, CCardBody, CSpinner } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilUser, cilBasket, cilEnvelopeClosed, cilPhone, cilBriefcase } from '@coreui/icons';
import FormGrid from '../../components/FormGrid';
import { 
  getCustomerDetails, 
  createCustomerDetail, 
  updateCustomerDetail, 
  deleteCustomerDetail, 
  getCustomerCompanies 
} from '../../services/api';
import { validateForm, validationSchemas } from '../../utils/formValidation';
import { useAuth } from '../../contexts/AuthContext';

const CustomerDetails = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customerDetails, setCustomerDetails] = useState([]);
  const [customerCompanies, setCustomerCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isAdmin = user && user.role === 'admin';

  // Fetch customer companies for dropdown
  useEffect(() => {
    const fetchCustomerCompanies = async () => {
      try {
        const response = await getCustomerCompanies();
        setCustomerCompanies(response.data.data || response.data);
      } catch (err) {
        console.error("Failed to fetch customer companies:", err);
      }
    };
    
    fetchCustomerCompanies();
  }, []);

  // Define form fields for customer contact management
  const formFields = [
    {
      name: 'first_name',
      label: 'First Name',
      type: 'text',
      required: true,
      placeholder: 'Enter first name'
    },
    {
      name: 'last_name',
      label: 'Last Name',
      type: 'text',
      required: true,
      placeholder: 'Enter last name'
    },
    {
      name: 'customer_company_id',
      label: 'Company',
      type: 'select',
      required: false,
      placeholder: 'Select company',
      tooltip: 'The customer company this contact belongs to',
      options: customerCompanies.map(company => ({
        value: company.customer_company_id,
        label: company.name
      }))
    },
    {
      name: 'position',
      label: 'Position',
      type: 'text',
      placeholder: 'Enter job position',
      tooltip: 'The job position of this contact'
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'Enter email address',
      prefix: '@'
    },
    {
      name: 'phone',
      label: 'Phone',
      type: 'tel',
      placeholder: 'Enter phone number'
    }
  ];

  // Define grid columns for customer details list
  const gridColumns = [
    { 
      key: 'full_name', 
      label: 'Contact Name',
      sortable: true,
      render: (value, row) => (
        <div className="d-flex align-items-center">
          <div className="bg-light p-2 rounded-circle me-3">
            <CIcon icon={cilUser} size="lg" />
          </div>
          <div>
            <div className="fw-bold">{row.first_name} {row.last_name}</div>
            {row.position && (
              <small className="text-muted">{row.position}</small>
            )}
          </div>
        </div>
      )
    },
    { 
      key: 'company_name', 
      label: 'Company',
      sortable: true,
      render: (value) => (
        <div className="d-flex align-items-center">
          <CIcon icon={cilBasket} className="me-2 text-muted" size="sm" />
          {value || 'N/A'}
        </div>
      )
    },
    { 
      key: 'contact_info',
      label: 'Contact Info', 
      sortable: false,
      render: (value, row) => (
        <div>
          {row.email && (
            <div className="d-flex align-items-center mb-1">
              <CIcon icon={cilEnvelopeClosed} className="me-2 text-muted" size="sm" />
              <a href={`mailto:${row.email}`}>{row.email}</a>
            </div>
          )}
          {row.phone && (
            <div className="d-flex align-items-center">
              <CIcon icon={cilPhone} className="me-2 text-muted" size="sm" />
              <a href={`tel:${row.phone}`}>{row.phone}</a>
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'position', 
      label: 'Position',
      sortable: true,
      render: (value) => (
        <div className="d-flex align-items-center">
          <CIcon icon={cilBriefcase} className="me-2 text-muted" size="sm" />
          {value || 'N/A'}
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Created At',
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    }
  ];

  // Fetch customer details from API
  const fetchCustomerDetails = async (searchParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Build query params from search fields
      const queryParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await getCustomerDetails(queryParams.toString());
      setCustomerDetails(response.data.data || response.data);
    } catch (err) {
      console.error("Failed to fetch customer details:", err);
      setError("Failed to load customer contacts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, []);

  // Handle creating a new customer detail
  const handleCreateCustomerDetail = async (values) => {
    try {
      // Make sure we only submit the fields the backend expects
      const customerDetailData = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone: values.phone || '',
        position: values.position || '',
        customer_company_id: values.customer_company_id || null
      };
      
      await createCustomerDetail(customerDetailData);
      await fetchCustomerDetails();
      return true;
    } catch (error) {
      console.error("Error creating customer contact:", error);
      throw new Error(error.message || "Failed to create customer contact");
    }
  };

  // Handle updating a customer detail
  const handleUpdateCustomerDetail = async (detail, values) => {
    try {
      // Make sure we only submit the fields the backend expects
      const customerDetailData = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone: values.phone || '',
        position: values.position || '',
        customer_company_id: values.customer_company_id || null
      };
      
      // Ensure we're using the correct ID field - it should be customer_id
      const customerId = detail.customer_id;
      
      if (!customerId) {
        throw new Error("Customer ID is missing");
      }
      
      await updateCustomerDetail(customerId, customerDetailData);
      await fetchCustomerDetails();
      return true;
    } catch (error) {
      console.error("Error updating customer contact:", error);
      throw new Error(error.message || "Failed to update customer contact");
    }
  };

  // Handle deleting a customer detail
  const handleDeleteCustomerDetail = async (detail) => {
    try {
      await deleteCustomerDetail(detail.customer_id);
      await fetchCustomerDetails();
      return true;
    } catch (error) {
      console.error("Error deleting customer contact:", error);
      throw new Error(error.message || "Failed to delete customer contact");
      }
  };

  // Form validation
  const validateCustomerDetailForm = (values) => {
    return validateForm(values, validationSchemas.customerDetail);
  };

  // Show loading spinner while data is loading
  if (loading && !customerDetails.length) {
  return (
        <CCard className="mb-4">
        <CCardBody className="text-center p-5">
          <CSpinner color="primary" />
          <div className="mt-3">Loading customer contacts...</div>
          </CCardBody>
        </CCard>
    );
  }

  return (
    <FormGrid
      title="Customer Contacts"
      data={customerDetails}
      columns={gridColumns}
      formFields={formFields}
      formTitle="Customer Contact Information"
      loading={loading}
      onFetchData={fetchCustomerDetails}
      onCreate={handleCreateCustomerDetail}
      onUpdate={handleUpdateCustomerDetail}
      onDelete={handleDeleteCustomerDetail}
      validateForm={validateCustomerDetailForm}
      enableCreate={isAdmin}
      enableEdit={isAdmin}
      enableDelete={isAdmin}
      formPosition="modal"
      showSearchForm={true}
      confirmDelete={true}
      deleteMessage="Are you sure you want to delete this customer contact? This action cannot be undone."
    />
  );
};

export default CustomerDetails;

