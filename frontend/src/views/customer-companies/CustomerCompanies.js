import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CCard, CCardBody, CSpinner } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilBasket, cilLocationPin, cilEnvelopeClosed, cilPhone, cilGlobeAlt } from '@coreui/icons';
import FormGrid from '../../components/FormGrid';
import { getCustomerCompanies, createCustomerCompany, updateCustomerCompany, deleteCustomerCompany } from '../../services/api';
import { validateForm, validationSchemas } from '../../utils/formValidation';
import { useAuth } from '../../contexts/AuthContext';

const industryOptions = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'media', label: 'Media' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'other', label: 'Other' }
];

const CustomerCompanies = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customerCompanies, setCustomerCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isAdmin = user && user.role === 'admin';

  // Define form fields for customer company management
  const formFields = [
    {
      name: 'name',
      label: 'Company Name',
      type: 'text',
      required: true,
      placeholder: 'Enter company name',
      tooltip: 'The official registered name of the customer company',
      colSpan: 2
    },
    {
      name: 'industry',
      label: 'Industry',
      type: 'select',
      placeholder: 'Select industry',
      tooltip: 'The primary industry of the customer company',
      options: industryOptions
    },
    {
      name: 'address',
      label: 'Address',
      type: 'textarea',
      placeholder: 'Enter company address',
      tooltip: 'The physical location of the customer company headquarters',
      rows: 3,
      colSpan: 2
    },
    {
      name: 'contact_email',
      label: 'Contact Email',
      type: 'email',
      placeholder: 'Enter contact email',
      tooltip: 'Primary contact email for the customer company',
      prefix: '@'
    },
    {
      name: 'contact_phone',
      label: 'Contact Phone',
      type: 'tel',
      placeholder: 'Enter contact phone',
      tooltip: 'Primary contact phone number for the customer company'
    }
  ];

  // Define grid columns for customer companies list
  const gridColumns = [
    { 
      key: 'name', 
      label: 'Company Name',
      sortable: true,
      render: (value, row) => (
        <div className="d-flex align-items-center">
          <div className="bg-light p-2 rounded-circle me-3">
            <CIcon icon={cilBasket} size="lg" />
          </div>
          <div>
            <div className="fw-bold">{value}</div>
            {row.industry && (
              <small className="text-muted">
                Industry: {row.industry}
              </small>
            )}
          </div>
        </div>
      )
    },
    { 
      key: 'contact_info',
      label: 'Contact Info', 
      sortable: false,
      render: (value, row) => (
        <div>
          {row.contact_email && (
            <div className="d-flex align-items-center mb-1">
              <CIcon icon={cilEnvelopeClosed} className="me-2 text-muted" size="sm" />
              <a href={`mailto:${row.contact_email}`}>{row.contact_email}</a>
            </div>
          )}
          {row.contact_phone && (
            <div className="d-flex align-items-center">
              <CIcon icon={cilPhone} className="me-2 text-muted" size="sm" />
              <a href={`tel:${row.contact_phone}`}>{row.contact_phone}</a>
            </div>
          )}
        </div>
      )
    },

    { 
      key: 'address', 
      label: 'Address',
      sortable: true,
      render: (value) => (
        <div className="d-flex align-items-center">
          <CIcon icon={cilLocationPin} className="me-2 text-muted" size="sm" />
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

  // Fetch customer companies from API
  const fetchCustomerCompanies = async (searchParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Build query params from search fields
      const queryParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await getCustomerCompanies(queryParams.toString());
      setCustomerCompanies(response.data.data || response.data);
    } catch (err) {
      console.error("Failed to fetch customer companies:", err);
      setError("Failed to load customer companies. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerCompanies();
  }, []);

  // Handle creating a new customer company
  const handleCreateCustomerCompany = async (values) => {
    try {
      // Make sure we only submit the fields the backend expects
      const customerCompanyData = {
        name: values.name,
        industry: values.industry || '',
        address: values.address || '',
        contact_email: values.contact_email || '',
        contact_phone: values.contact_phone || '',
      };
      
      await createCustomerCompany(customerCompanyData);
      await fetchCustomerCompanies();
      return true;
    } catch (error) {
      console.error("Error creating customer company:", error);
      throw new Error(error.message || "Failed to create customer company");
    }
  };

  // Handle updating a customer company
  const handleUpdateCustomerCompany = async (company, values) => {
    try {
      // Make sure we only submit the fields the backend expects
      const customerCompanyData = {
        name: values.name,
        industry: values.industry || '',
        address: values.address || '',
        contact_email: values.contact_email || '',
        contact_phone: values.contact_phone || '',
      };
      
      await updateCustomerCompany(company.customer_company_id, customerCompanyData);
      await fetchCustomerCompanies();
      return true;
    } catch (error) {
      console.error("Error updating customer company:", error);
      throw new Error(error.message || "Failed to update customer company");
    }
  };

  // Handle deleting a customer company
  const handleDeleteCustomerCompany = async (company) => {
      try {
      await deleteCustomerCompany(company.customer_company_id);
      await fetchCustomerCompanies();
      return true;
    } catch (error) {
      console.error("Error deleting customer company:", error);
      throw new Error(error.message || "Failed to delete customer company");
      }
  };

  // Form validation
  const validateCustomerCompanyForm = (values) => {
    return validateForm(values, validationSchemas.customerCompany);
  };

  // Show loading spinner while data is loading
  if (loading && !customerCompanies.length) {
  return (
        <CCard className="mb-4">
        <CCardBody className="text-center p-5">
          <CSpinner color="primary" />
          <div className="mt-3">Loading customer companies...</div>
          </CCardBody>
        </CCard>
    );
  }

  return (
    <FormGrid
      title="Customer Companies"
      data={customerCompanies}
      columns={gridColumns}
      formFields={formFields}
      formTitle="Customer Company Information"
      loading={loading}
      onFetchData={fetchCustomerCompanies}
      onCreate={handleCreateCustomerCompany}
      onUpdate={handleUpdateCustomerCompany}
      onDelete={handleDeleteCustomerCompany}
      validateForm={validateCustomerCompanyForm}
      enableCreate={isAdmin}
      enableEdit={isAdmin}
      enableDelete={isAdmin}
      formPosition="modal"
      showSearchForm={true}
      confirmDelete={true}
      deleteMessage="Are you sure you want to delete this customer company? This action cannot be undone and will also affect all customer contacts associated with this company."
    />
  );
};

export default CustomerCompanies;

