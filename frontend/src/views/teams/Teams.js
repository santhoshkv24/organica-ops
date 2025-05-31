import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CButton, CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow, CSpinner } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPlus, cilPencil, cilTrash } from '@coreui/icons';
import { getTeams, deleteTeam, getDepartments, getCompanies } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState({}); // Store departments by ID
  const [companies, setCompanies] = useState({}); // Store companies by ID
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
      // Fetch teams, departments, and companies concurrently
      const [teamResponse, deptResponse, compResponse] = await Promise.all([
        getTeams(),
        getDepartments(),
        getCompanies()
      ]);

      const fetchedTeams = Array.isArray(teamResponse?.data) ? teamResponse.data : [];
      const fetchedDepartments = Array.isArray(deptResponse?.data) ? deptResponse.data : [];
      const fetchedCompanies = Array.isArray(compResponse?.data) ? compResponse.data : [];

      // Create lookup maps
      const departmentMap = fetchedDepartments.reduce((acc, dept) => {
        acc[dept.id] = dept.name;
        return acc;
      }, {});
      const companyMap = fetchedCompanies.reduce((acc, company) => {
        acc[company.id] = company.name;
        return acc;
      }, {});

      setTeams(fetchedTeams);
      setDepartments(departmentMap);
      setCompanies(companyMap);

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(typeof err === 'string' ? err : 'Failed to fetch teams. Please try again.');
      setTeams([]);
      setDepartments({});
      setCompanies({});
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await deleteTeam(id);
        fetchInitialData(); // Re-fetch data
      } catch (err) {
        console.error("Error deleting team:", err);
        setError(typeof err === 'string' ? err : 'Failed to delete team.');
      }
    }
  };

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Teams List</strong>
            {isAdmin && (
              <Link to="/teams/create">
                <CButton color="primary" size="sm">
                  <CIcon icon={cilPlus} className="me-2" /> Add Team
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
                    <CTableHeaderCell>Department</CTableHeaderCell>
                    <CTableHeaderCell>Company</CTableHeaderCell> {/* Added Company */} 
                    <CTableHeaderCell>Description</CTableHeaderCell>
                    {isAdmin && <CTableHeaderCell>Actions</CTableHeaderCell>}
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {teams.length > 0 ? (
                    teams.map((team) => (
                      <CTableRow key={team.id}>
                        <CTableDataCell>{team.name}</CTableDataCell>
                        <CTableDataCell>{departments[team.department_id] || 'N/A'}</CTableDataCell>
                        <CTableDataCell>{companies[team.company_id] || 'N/A'}</CTableDataCell> {/* Display Company */} 
                        <CTableDataCell>{team.description || '-'}</CTableDataCell>
                        {isAdmin && (
                          <CTableDataCell>
                            <Link to={`/teams/${team.id}/edit`}>
                              <CButton color="info" size="sm" className="me-2">
                                <CIcon icon={cilPencil} />
                              </CButton>
                            </Link>
                            <CButton color="danger" size="sm" onClick={() => handleDelete(team.id)}>
                              <CIcon icon={cilTrash} />
                            </CButton>
                          </CTableDataCell>
                        )}
                      </CTableRow>
                    ))
                  ) : (
                    <CTableRow>
                      <CTableDataCell colSpan={isAdmin ? 5 : 4} className="text-center">
                        No teams found.
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

export default Teams;

