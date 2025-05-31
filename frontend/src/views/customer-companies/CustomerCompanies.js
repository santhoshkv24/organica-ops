import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CButton, CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow, CSpinner } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPlus, cilPencil, cilTrash } from '@coreui/icons';
import { getCustomerCompanies, deleteCustomerCompany } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

const CustomerCompanies = () => {
  const [customerCompanies, setCustomerCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchCustomerCompanies();
  }, []);

  const fetchCustomerCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getCustomerCompanies();
      setCustomerCompanies(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching customer companies:", err);
      setError(typeof err === 'string' ? err : 'Failed to fetch customer companies.');
      setCustomerCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer company?')) {
      try {
        await deleteCustomerCompany(id);
        fetchCustomerCompanies(); // Refresh list
      } catch (err) {
        console.error("Error deleting customer company:", err);
        setError(typeof err === 'string' ? err : 'Failed to delete customer company.');
      }
    }
  };

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Customer Companies List</strong>
            {isAdmin && (
              <Link to="/customer-companies/create">
                <CButton color="primary" size="sm">
                  <CIcon icon={cilPlus} className="me-2" /> Add Customer Company
                </CButton>
              </Link>
            )}
          </CCardHeader>
          <CCardBody>
            {loading && <div className="text-center"><CSpinner color="primary" /></div>}
            {error && <p className="text-danger">{error}</p>}
            {!loading && !error && (
              <CTable align="middle" className="mb-0 border" hover responsive>
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Name</CTableHeaderCell>
                    <CTableHeaderCell>Address</CTableHeaderCell>
                    <CTableHeaderCell>Phone</CTableHeaderCell>
                    <CTableHeaderCell>Email</CTableHeaderCell>
                    <CTableHeaderCell>Industry</CTableHeaderCell>
                    {isAdmin && <CTableHeaderCell>Actions</CTableHeaderCell>}
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {customerCompanies.length > 0 ? (
                    customerCompanies.map((company) => (
                      <CTableRow key={company.id}>
                        <CTableDataCell>{company.name}</CTableDataCell>
                        <CTableDataCell>{company.address || '-'}</CTableDataCell>
                        <CTableDataCell>{company.phone_no || '-'}</CTableDataCell>
                        <CTableDataCell>{company.email || '-'}</CTableDataCell>
                        <CTableDataCell>{company.industry || '-'}</CTableDataCell>
                        {isAdmin && (
                          <CTableDataCell>
                            <Link to={`/customer-companies/${company.id}/edit`}>
                              <CButton color="info" size="sm" className="me-2">
                                <CIcon icon={cilPencil} />
                              </CButton>
                            </Link>
                            <CButton color="danger" size="sm" onClick={() => handleDelete(company.id)}>
                              <CIcon icon={cilTrash} />
                            </CButton>
                          </CTableDataCell>
                        )}
                      </CTableRow>
                    ))
                  ) : (
                    <CTableRow>
                      <CTableDataCell colSpan={isAdmin ? 6 : 5} className="text-center">
                        No customer companies found.
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default CustomerCompanies;

