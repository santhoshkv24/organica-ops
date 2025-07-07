import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CCard, CCardBody, CSpinner } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilBuilding, cilLocationPin, cilEnvelopeClosed, cilPhone } from '@coreui/icons';
import FormGrid from '../../components/FormGrid';
import { getCompanies, createCompany, updateCompany, deleteCompany } from '../../services/api';
import { validateForm, validationSchemas } from '../../utils/formValidation';
import { useAuth } from '../../contexts/AuthContext';

const Companies = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isAdmin = user && user.role === 'admin';

  // Define form fields for company management
  const formFields = [
    {
      name: 'name',
      label: 'Division',
      type: 'text',
      required: true,
      placeholder: 'Enter division name',
      tooltip: 'The official registered name of the company',
      colSpan: 2
    },
    {
      name: 'address',
      label: 'Address',
      type: 'textarea',
      required: false,
      placeholder: 'Enter company address',
      tooltip: 'The physical location of the company headquarters',
      rows: 3,
      colSpan: 2
    },
    {
      name: 'contact_email',
      label: 'Email',
      type: 'email',
      required: false,
      placeholder: 'Enter contact email',
      tooltip: 'Primary contact email for the company',
      prefix: '@'
    },
    {
      name: 'contact_phone',
      label: 'Phone',
      type: 'tel',
      required: false,
      placeholder: 'Enter contact phone',
      tooltip: 'Primary contact phone number for the company'
    }
  ];

  // Define grid columns for companies list
  const gridColumns = [
    { 
      key: 'name', 
      label: 'Division',
      sortable: true,
      render: (value, row) => (
        <div className="d-flex align-items-center">
          <div className="bg-light p-2 rounded-circle me-3">
            <CIcon icon={cilBuilding} size="lg" />
          </div>
          <div>
            <div className="fw-bold">{value}</div>
            {row.website && (
              <small className="text-muted text-truncate d-block" style={{ maxWidth: '200px' }}>
                {row.website}
              </small>
            )}
          </div>
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
      key: 'contact_email', 
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
      key: 'contact_phone', 
      label: 'Phone',
      sortable: true,
      render: (value) => (
        <div className="d-flex align-items-center">
          <CIcon icon={cilPhone} className="me-2 text-muted" size="sm" />
          <a href={`tel:${value}`}>{value}</a>
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Created At',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    }
  ];

  // Fetch companies from API
  const fetchCompanies = async (searchParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Build query params from search fields
      const queryParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await getCompanies(queryParams.toString());
      console.log('API Response:', response);
      
      // Check the data structure and log it
      const branchesData = response.data.data || response.data;
      console.log('Branches data:', branchesData);
      if (branchesData.length > 0) {
        console.log('First branch properties:', Object.keys(branchesData[0]));
      }
      
      setCompanies(branchesData);
    } catch (err) {
      console.error("Failed to fetch companies:", err);
      setError("Failed to load companies. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Handle creating a new company
  const handleCreateCompany = async (values) => {
    try {
      // Make sure we only submit the fields the backend expects
      const companyData = {
        name: values.name,
        address: values.address || '',
        contact_email: values.contact_email || '',
        contact_phone: values.contact_phone || ''
      };
      
      await createCompany(companyData);
      await fetchCompanies();
      return true;
    } catch (error) {
      console.error("Error creating company:", error);
      throw new Error(error.message || "Failed to create company");
    }
  };

  // Handle updating a company
  const handleUpdateCompany = async (company, values) => {
    try {
      // Make sure we only submit the fields the backend expects
      const companyData = {
        name: values.name,
        address: values.address || '',
        contact_email: values.contact_email || '',
        contact_phone: values.contact_phone || ''
      };
      
      // Get branch ID, trying different possible property names
      const branchId = company.branch_id || company.company_id;
      
      if (!branchId) {
        throw new Error('Cannot find valid branch ID');
      }
      
      await updateCompany(branchId, companyData);
      await fetchCompanies();
      return true;
    } catch (error) {
      console.error("Error updating company:", error);
      throw new Error(error.message || "Failed to update company");
    }
  };

  // Handle deleting a company
  const handleDeleteCompany = async (company) => {
    try {
      // Get branch ID, trying different possible property names
      const branchId = company.branch_id || company.company_id;
      
      if (!branchId) {
        throw new Error('Cannot find valid branch ID');
      }
      
      await deleteCompany(branchId);
      await fetchCompanies();
      return true;
    } catch (error) {
      console.error("Error deleting company:", error);
      throw new Error(error.message || "Failed to delete company");
    }
  };

  // Form validation
  const validateCompanyForm = (values) => {
    // Create a temporary schema with only the fields we need
    const companySchema = {
      name: validationSchemas.company.name,
      address: validationSchemas.company.address,
      contact_email: {
        label: 'Email',
        type: 'email',
        maxLength: 100
      },
      contact_phone: {
        label: 'Phone',
        type: 'phone',
        maxLength: 20
      }
    };
    
    return validateForm(values, companySchema);
  };

  // Show loading spinner while data is loading
  if (loading && !companies.length) {
    return (
      <CCard className="mb-4">
        <CCardBody className="text-center p-5">
          <CSpinner color="primary" />
          <div className="mt-3">Loading companies...</div>
        </CCardBody>
      </CCard>
    );
  }

  return (
    <FormGrid
      title="Divisions"
        data={companies}
      columns={gridColumns}
      formFields={formFields}
      formTitle="Company Information"
        loading={loading}
      onFetchData={fetchCompanies}
      onCreate={handleCreateCompany}
      onUpdate={handleUpdateCompany}
        onDelete={handleDeleteCompany}
      validateForm={validateCompanyForm}
      enableCreate={isAdmin}
      enableEdit={isAdmin}
      enableDelete={isAdmin}
      formPosition="modal"
      showSearchForm={true}
      confirmDelete={true}
      deleteMessage="Are you sure you want to delete this company? This action cannot be undone and will also affect all departments and teams associated with this company."
    />
  );
};

export default Companies;

