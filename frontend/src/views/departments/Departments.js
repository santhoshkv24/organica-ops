import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CButton, CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow, CSpinner } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPlus, cilPencil, cilTrash } from '@coreui/icons';
import { getDepartments, deleteDepartment, getCompanies } from '../../services/apiService'; // Assuming getCompanies is needed
import { useAuth } from '../../contexts/AuthContext';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [companies, setCompanies] = useState({}); // Store companies by ID for lookup
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
      // Fetch both departments and companies concurrently
      const [deptResponse, compResponse] = await Promise.all([
        getDepartments(),
        getCompanies() // Fetch companies to display names
      ]);

      const fetchedDepartments = Array.isArray(deptResponse?.data) ? deptResponse.data : [];
      const fetchedCompanies = Array.isArray(compResponse?.data) ? compResponse.data : [];

      // Create a lookup map for company names
      const companyMap = fetchedCompanies.reduce((acc, company) => {
        acc[company.id] = company.name;
        return acc;
      }, {});

      setDepartments(fetchedDepartments);
      setCompanies(companyMap);

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(typeof err === 'string' ? err : 'Failed to fetch departments. Please try again.');
      setDepartments([]);
      setCompanies({});
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await deleteDepartment(id);
        // Refresh the list after deletion
        fetchInitialData(); // Re-fetch data to update the list
      } catch (err) {
        console.error("Error deleting department:", err);
        setError(typeof err === 'string' ? err : 'Failed to delete department.');
      }
    }
  };

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Departments List</strong>
            {isAdmin && (
              <Link to="/departments/create">
                <CButton color="primary" size="sm">
                  <CIcon icon={cilPlus} className="me-2" /> Add Department
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
                    <CTableHeaderCell>Company</CTableHeaderCell>
                    <CTableHeaderCell>Description</CTableHeaderCell>
                    {isAdmin && <CTableHeaderCell>Actions</CTableHeaderCell>}
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {departments.length > 0 ? (
                    departments.map((department) => (
                      <CTableRow key={department.id}>
                        <CTableDataCell>{department.name}</CTableDataCell>
                        <CTableDataCell>{companies[department.company_id] || 'N/A'}</CTableDataCell>
                        <CTableDataCell>{department.description || '-'}</CTableDataCell>
                        {isAdmin && (
                          <CTableDataCell>
                            <Link to={`/departments/${department.id}/edit`}>
                              <CButton color="info" size="sm" className="me-2">
                                <CIcon icon={cilPencil} />
                              </CButton>
                            </Link>
                            <CButton color="danger" size="sm" onClick={() => handleDelete(department.id)}>
                              <CIcon icon={cilTrash} />
                            </CButton>
                          </CTableDataCell>
                        )}
                      </CTableRow>
                    ))
                  ) : (
                    <CTableRow>
                      <CTableDataCell colSpan={isAdmin ? 4 : 3} className="text-center">
                        No departments found.
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

export default Departments;

