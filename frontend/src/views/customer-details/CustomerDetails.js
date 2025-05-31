import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CButton, CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow, CSpinner } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPlus, cilPencil, cilTrash } from '@coreui/icons';
import { getCustomerDetails, deleteCustomerDetail, getCustomerCompanies } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

const CustomerDetails = () => {
  const [customers, setCustomers] = useState([]);
  const [customerCompanies, setCustomerCompanies] = useState({}); // For lookup
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const [custResponse, compResponse] = await Promise.all([
        getCustomerDetails(),
        getCustomerCompanies() // Fetch companies for lookup
      ]);

      const fetchedCustomers = Array.isArray(custResponse?.data) ? custResponse.data : [];
      const fetchedCompanies = Array.isArray(compResponse?.data) ? compResponse.data : [];

      const companyMap = fetchedCompanies.reduce((acc, company) => {
        acc[company.id] = company.name;
        return acc;
      }, {});

      setCustomers(fetchedCustomers);
      setCustomerCompanies(companyMap);

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(typeof err === 'string' ? err : 'Failed to fetch customer details.');
      setCustomers([]);
      setCustomerCompanies({});
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomerDetail(id);
        fetchInitialData(); // Refresh list
      } catch (err) {
        console.error("Error deleting customer:", err);
        setError(typeof err === 'string' ? err : 'Failed to delete customer.');
      }
    }
  };

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Customer Details List</strong>
            {isAdmin && (
              <Link to="/customer-details/create">
                <CButton color="primary" size="sm">
                  <CIcon icon={cilPlus} className="me-2" /> Add Customer
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
                    <CTableHeaderCell>Email</CTableHeaderCell>
                    <CTableHeaderCell>Mobile</CTableHeaderCell>
                    <CTableHeaderCell>Designation</CTableHeaderCell>
                    <CTableHeaderCell>Company</CTableHeaderCell>
                    {isAdmin && <CTableHeaderCell>Actions</CTableHeaderCell>}
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {customers.length > 0 ? (
                    customers.map((customer) => (
                      <CTableRow key={customer.id}>
                        <CTableDataCell>{customer.name}</CTableDataCell>
                        <CTableDataCell>{customer.email || '-'}</CTableDataCell>
                        <CTableDataCell>{customer.mobile_no || '-'}</CTableDataCell>
                        <CTableDataCell>{customer.designation || '-'}</CTableDataCell>
                        <CTableDataCell>{customerCompanies[customer.customer_company_id] || 'N/A'}</CTableDataCell>
                        {isAdmin && (
                          <CTableDataCell>
                            <Link to={`/customer-details/${customer.id}/edit`}>
                              <CButton color="info" size="sm" className="me-2">
                                <CIcon icon={cilPencil} />
                              </CButton>
                            </Link>
                            <CButton color="danger" size="sm" onClick={() => handleDelete(customer.id)}>
                              <CIcon icon={cilTrash} />
                            </CButton>
                          </CTableDataCell>
                        )}
                      </CTableRow>
                    ))
                  ) : (
                    <CTableRow>
                      <CTableDataCell colSpan={isAdmin ? 6 : 5} className="text-center">
                        No customers found.
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

export default CustomerDetails;

