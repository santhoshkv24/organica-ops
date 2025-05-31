import React, { useState, useEffect } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
  CAlert,
  CWidgetStatsF,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilPeople,
  cilBriefcase,
  cilBuilding,
  cilGroup,
  cilUser,
  cilChart,
} from '@coreui/icons';
import {
  getCompanies,
  getDepartments,
  getTeams,
  getEmployees,
  getCustomerCompanies,
} from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    companies: 0,
    departments: 0,
    teams: 0,
    employees: 0,
    customers: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week'); // week, month, year

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        companiesRes,
        departmentsRes,
        teamsRes,
        employeesRes,
        customersRes,
      ] = await Promise.all([
        getCompanies(),
        getDepartments(),
        getTeams(),
        getEmployees(),
        getCustomerCompanies(),
      ]);

      setStats({
        companies: companiesRes.data.length,
        departments: departmentsRes.data.length,
        teams: teamsRes.data.length,
        employees: employeesRes.data.length,
        customers: customersRes.data.length,
      });

      // Simulate recent activities (replace with actual data when available)
      const activities = [
        ...companiesRes.data.slice(0, 3).map(c => ({
          type: 'company',
          name: c.name,
          action: 'added',
          date: new Date().toISOString(),
        })),
        ...employeesRes.data.slice(0, 3).map(e => ({
          type: 'employee',
          name: `${e.first_name} ${e.last_name}`,
          action: 'updated',
          date: new Date().toISOString(),
        })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      setRecentActivities(activities);
    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again later.');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <CRow>
        <CCol xs={12} className="text-center py-5">
          <CSpinner color="primary" />
        </CCol>
      </CRow>
    );
  }

  return (
    <>
      {error && (
        <CAlert color="danger" dismissible>
          {error}
        </CAlert>
      )}

      <CRow>
        <CCol xs={12}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Dashboard Overview</h2>
            <CDropdown>
              <CDropdownToggle color="primary">
                {timeRange === 'week' ? 'This Week' : timeRange === 'month' ? 'This Month' : 'This Year'}
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem onClick={() => setTimeRange('week')}>This Week</CDropdownItem>
                <CDropdownItem onClick={() => setTimeRange('month')}>This Month</CDropdownItem>
                <CDropdownItem onClick={() => setTimeRange('year')}>This Year</CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          </div>
        </CCol>
      </CRow>

      <CRow>
        <CCol sm={6} lg={4}>
          <CWidgetStatsF
            className="mb-3"
            icon={<CIcon icon={cilBuilding} height={24} />}
            title="Companies"
            value={stats.companies}
            color="primary"
          />
        </CCol>
        <CCol sm={6} lg={4}>
          <CWidgetStatsF
            className="mb-3"
            icon={<CIcon icon={cilBriefcase} height={24} />}
            title="Departments"
            value={stats.departments}
            color="info"
          />
        </CCol>
        <CCol sm={6} lg={4}>
          <CWidgetStatsF
            className="mb-3"
            icon={<CIcon icon={cilGroup} height={24} />}
            title="Teams"
            value={stats.teams}
            color="warning"
          />
        </CCol>
        <CCol sm={6} lg={6}>
          <CWidgetStatsF
            className="mb-3"
            icon={<CIcon icon={cilPeople} height={24} />}
            title="Employees"
            value={stats.employees}
            color="success"
          />
        </CCol>
        <CCol sm={6} lg={6}>
          <CWidgetStatsF
            className="mb-3"
            icon={<CIcon icon={cilUser} height={24} />}
            title="Customer Companies"
            value={stats.customers}
            color="danger"
          />
        </CCol>
      </CRow>

      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <strong>Recent Activities</strong>
                <CIcon icon={cilChart} height={24} />
              </div>
            </CCardHeader>
            <CCardBody>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell scope="col">Type</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Name</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Action</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Date</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {recentActivities.map((activity, index) => (
                    <CTableRow key={index}>
                      <CTableDataCell>
                        <CIcon
                          icon={
                            activity.type === 'company'
                              ? cilBuilding
                              : activity.type === 'employee'
                              ? cilUser
                              : cilPeople
                          }
                          height={18}
                          className="me-2"
                        />
                        {activity.type}
                      </CTableDataCell>
                      <CTableDataCell>{activity.name}</CTableDataCell>
                      <CTableDataCell>{activity.action}</CTableDataCell>
                      <CTableDataCell>
                        {new Date(activity.date).toLocaleDateString()}
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
};

export default Dashboard;

