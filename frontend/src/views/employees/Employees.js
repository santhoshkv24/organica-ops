import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CButton, CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow, CSpinner } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPlus, cilPencil, cilTrash } from '@coreui/icons';
import { getEmployees, deleteEmployee, getCompanies, getDepartments, getTeams } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState({});
  const [departments, setDepartments] = useState({});
  const [teams, setTeams] = useState({});
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
      const [empResponse, compResponse, deptResponse, teamResponse] = await Promise.all([
        getEmployees(),
        getCompanies(),
        getDepartments(),
        getTeams()
      ]);

      const fetchedEmployees = Array.isArray(empResponse?.data) ? empResponse.data : [];
      const fetchedCompanies = Array.isArray(compResponse?.data) ? compResponse.data : [];
      const fetchedDepartments = Array.isArray(deptResponse?.data) ? deptResponse.data : [];
      const fetchedTeams = Array.isArray(teamResponse?.data) ? teamResponse.data : [];

      const companyMap = fetchedCompanies.reduce((acc, item) => { acc[item.id] = item.name; return acc; }, {});
      const departmentMap = fetchedDepartments.reduce((acc, item) => { acc[item.id] = item.name; return acc; }, {});
      const teamMap = fetchedTeams.reduce((acc, item) => { acc[item.id] = item.name; return acc; }, {});

      setEmployees(fetchedEmployees);
      setCompanies(companyMap);
      setDepartments(departmentMap);
      setTeams(teamMap);

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(typeof err === 'string' ? err : 'Failed to fetch employees. Please try again.');
      setEmployees([]);
      setCompanies({});
      setDepartments({});
      setTeams({});
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(id);
        fetchInitialData(); // Re-fetch data
      } catch (err) {
        console.error("Error deleting employee:", err);
        setError(typeof err === 'string' ? err : 'Failed to delete employee.');
      }
    }
  };

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Employees List</strong>
            {isAdmin && (
              <Link to="/employees/create">
                <CButton color="primary" size="sm">
                  <CIcon icon={cilPlus} className="me-2" /> Add Employee
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
                    <CTableHeaderCell>Company</CTableHeaderCell>
                    <CTableHeaderCell>Department</CTableHeaderCell>
                    <CTableHeaderCell>Team</CTableHeaderCell>
                    <CTableHeaderCell>Role</CTableHeaderCell>
                    {isAdmin && <CTableHeaderCell>Actions</CTableHeaderCell>}
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {employees.length > 0 ? (
                    employees.map((employee) => (
                      <CTableRow key={employee.id}>
                        <CTableDataCell>{employee.name}</CTableDataCell>
                        <CTableDataCell>{employee.email || '-'}</CTableDataCell>
                        <CTableDataCell>{companies[employee.company_id] || 'N/A'}</CTableDataCell>
                        <CTableDataCell>{departments[employee.department_id] || 'N/A'}</CTableDataCell>
                        <CTableDataCell>{teams[employee.team_id] || 'N/A'}</CTableDataCell>
                        <CTableDataCell>{employee.role || '-'}</CTableDataCell>
                        {isAdmin && (
                          <CTableDataCell>
                            <Link to={`/employees/${employee.id}/edit`}>
                              <CButton color="info" size="sm" className="me-2">
                                <CIcon icon={cilPencil} />
                              </CButton>
                            </Link>
                            <CButton color="danger" size="sm" onClick={() => handleDelete(employee.id)}>
                              <CIcon icon={cilTrash} />
                            </CButton>
                          </CTableDataCell>
                        )}
                      </CTableRow>
                    ))
                  ) : (
                    <CTableRow>
                      <CTableDataCell colSpan={isAdmin ? 7 : 6} className="text-center">
                        No employees found.
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

export default Employees;

