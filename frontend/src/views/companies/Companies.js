import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CButton,
  CCol,
  CRow,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPlus } from '@coreui/icons';
import DataGrid from '../../components/DataGrid';
import FormBuilder from '../../components/FormBuilder';
import {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from '../../services/api';

const Companies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formValues, setFormValues] = useState({});

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await getCompanies();
      setCompanies(response.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (values) => {
    try {
      await createCompany(values);
      setShowForm(false);
      setFormValues({});
      fetchCompanies();
    } catch (error) {
      console.error('Error creating company:', error);
    }
  };

  const handleUpdateCompany = async (values) => {
    try {
      await updateCompany(editingCompany.company_id, values);
      setShowForm(false);
      setEditingCompany(null);
      setFormValues({});
      fetchCompanies();
    } catch (error) {
      console.error('Error updating company:', error);
    }
  };

  const handleDeleteCompany = async (company) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        await deleteCompany(company.company_id);
        fetchCompanies();
      } catch (error) {
        console.error('Error deleting company:', error);
      }
    }
  };

  const columns = [
    { key: 'name', label: 'Company Name' },
    { key: 'address', label: 'Address' },
    { key: 'contact_email', label: 'Email' },
    { key: 'contact_phone', label: 'Phone' },
    {
      key: 'created_at',
      label: 'Created At',
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  const formFields = [
    {
      name: 'name',
      label: 'Company Name',
      type: 'text',
      required: true,
      placeholder: 'Enter company name',
    },
    {
      name: 'address',
      label: 'Address',
      type: 'textarea',
      required: true,
      placeholder: 'Enter company address',
    },
    {
      name: 'contact_email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'Enter contact email',
    },
    {
      name: 'contact_phone',
      label: 'Phone',
      type: 'tel',
      required: true,
      placeholder: 'Enter contact phone',
    },
  ];

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Companies</h2>
            <CButton
              color="primary"
              onClick={() => {
                setEditingCompany(null);
                setFormValues({});
                setShowForm(true);
              }}
            >
              <CIcon icon={cilPlus} className="me-2" />
              Add Company
            </CButton>
          </div>
        </CCol>
      </CRow>

      <DataGrid
        title="Companies List"
        data={companies}
        columns={columns}
        loading={loading}
        onEdit={(company) => {
          setEditingCompany(company);
          setFormValues(company);
          setShowForm(true);
        }}
        onDelete={handleDeleteCompany}
        onView={(company) => navigate(`/companies/${company.company_id}`)}
      />

      <CModal
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingCompany(null);
          setFormValues({});
        }}
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>
            {editingCompany ? 'Edit Company' : 'Add New Company'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <FormBuilder
            fields={formFields}
            values={formValues}
            onChange={(name, value) =>
              setFormValues((prev) => ({ ...prev, [name]: value }))
            }
            onSubmit={editingCompany ? handleUpdateCompany : handleCreateCompany}
            onCancel={() => {
              setShowForm(false);
              setEditingCompany(null);
              setFormValues({});
            }}
            submitText={editingCompany ? 'Update' : 'Create'}
          />
        </CModalBody>
      </CModal>
    </>
  );
};

export default Companies;

