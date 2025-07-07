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
  CWidgetStatsB,
  CButton,
  CProgress,
  CBadge
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilPeople,
  cilBriefcase,
  cilBuilding,
  cilGroup,
  cilUser,
  cilChart,
  cilArrowTop,
  cilNotes,
  cilBasket,
  cilTask
} from '@coreui/icons';
import {
  getCompanies,
  getTeams,
  getEmployees,
  getCustomerCompanies,
  getTrackEntryStatistics
} from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    companies: 0,
    teams: 0,
    employees: 0,
    customerCompanies: 0,
    customerDetails: 0
  });
  const [taskStats, setTaskStats] = useState({
    total_tasks: 0,
    todo_count: 0,
    in_progress_count: 0,
    blocked_count: 0,
    done_count: 0,
  });
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
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
        teamsRes,
        employeesRes,
        customerCompaniesRes,
        customerDetailsRes,
        recentEmployeesRes,
        recentCustomersRes,
        taskStatsRes
      ] = await Promise.all([
        getCompanies(),
        getTeams(),
        getEmployees(),
        getCustomerCompanies(),
        getCustomerCompanies(),
        getEmployees({ sortBy: 'created_at', sortOrder: 'desc', limit: 5 }),
        getCustomerCompanies({ sortBy: 'created_at', sortOrder: 'desc', limit: 5 }),
        getTrackEntryStatistics()
      ]);

      setStats({
        companies: companiesRes.data.length,
        teams: teamsRes.data.length,
        employees: employeesRes.data.length,
        customerCompanies: customerCompaniesRes.data.length,
        customerDetails: customerDetailsRes.data.length
      });

      setRecentEmployees(recentEmployeesRes.data.data || []);
      setRecentCustomers(recentCustomersRes.data.data || []);
      
      // Set task statistics
      if (taskStatsRes && taskStatsRes.success && taskStatsRes.data) {
        console.log('Task statistics from API:', taskStatsRes.data);
        setTaskStats({
          total_tasks: taskStatsRes.data.total_tasks || 0,
          todo_count: taskStatsRes.data.todo_count || 0,
          in_progress_count: taskStatsRes.data.in_progress_count || 0,
          blocked_count: taskStatsRes.data.blocked_count || 0,
          done_count: taskStatsRes.data.done_count || 0
        });
      } else {
        console.warn('No task statistics returned from API');
        setTaskStats({
          total_tasks: 0,
          todo_count: 0,
          in_progress_count: 0,
          blocked_count: 0,
          done_count: 0
        });
      }
    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again later.');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colorMap = {
      active: 'success',
      inactive: 'secondary',
      pending: 'warning',
      terminated: 'danger'
    };
    return (
      <CBadge color={colorMap[status?.toLowerCase()] || 'info'}>
        {status || 'Unknown'}
      </CBadge>
    );
  };

  const renderTaskStatsSection = () => {
    return (
      <CRow className="mb-4">
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Task Tracking</strong>
            </CCardHeader>
            <CCardBody>
              <CRow>
                <CCol sm={6} lg={3} className="mb-4">
                  <div className="text-center">
                    <div className="h2 mb-0">{taskStats.total_tasks || 0}</div>
                    <div className="text-medium-emphasis">Total Tasks</div>
                  </div>
                </CCol>
                <CCol sm={6} lg={3} className="mb-4">
                  <div className="text-center">
                    <div className="h2 mb-0 text-primary">{taskStats.in_progress_count || 0}</div>
                    <div className="text-medium-emphasis">In Progress</div>
                  </div>
                </CCol>
                <CCol sm={6} lg={3} className="mb-4">
                  <div className="text-center">
                    <div className="h2 mb-0 text-danger">{taskStats.blocked_count || 0}</div>
                    <div className="text-medium-emphasis">Blocked</div>
                  </div>
                </CCol>
                <CCol sm={6} lg={3} className="mb-4">
                  <div className="text-center">
                    <div className="h2 mb-0 text-success">{taskStats.done_count || 0}</div>
                    <div className="text-medium-emphasis">Completed</div>
                  </div>
                </CCol>
              </CRow>
              
              <CProgress className="mb-3" height={20}>
                <CProgress 
                  value={(taskStats.todo_count || 0) / (taskStats.total_tasks || 1) * 100} 
                  color="secondary" 
                  variant="striped"
                />
                <CProgress 
                  value={(taskStats.in_progress_count || 0) / (taskStats.total_tasks || 1) * 100} 
                  color="primary" 
                  variant="striped"
                />
                <CProgress 
                  value={(taskStats.blocked_count || 0) / (taskStats.total_tasks || 1) * 100} 
                  color="danger" 
                  variant="striped"
                />
                <CProgress 
                  value={(taskStats.done_count || 0) / (taskStats.total_tasks || 1) * 100} 
                  color="success" 
                  variant="striped"
                />
              </CProgress>
              
              <div className="d-flex justify-content-center mt-3">
                <CButton 
                  color="primary" 
                  onClick={() => navigate('/track-entries/dashboard')}
                >
                  <CIcon icon={cilTask} className="me-2" />
                  View Task Dashboard
                </CButton>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    );
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
    <div className="dashboard">
      <h1 className="mb-4">Dashboard</h1>
      
      {/* Welcome Card */}
      <CCard className="mb-4 bg-light">
        <CCardBody>
          <h2>Welcome back, {user?.name || user?.username || 'User'}</h2>
          <p className="text-muted">
            Here's an overview of your organization's current status and recent activities.
          </p>
        </CCardBody>
      </CCard>

      {/* Task Stats Section */}
      {renderTaskStatsSection()}
      
      {/* Stats Overview */}
      <CRow className="mb-4">
        <CCol sm={6} lg={4} className="mb-4">
          <CWidgetStatsF
            icon={<CIcon icon={cilBuilding} height={24} />}
            title="Companies"
            value={stats.companies.toString()}
            color="primary"
            footer={
              <CButton 
                color="primary" 
                variant="outline" 
                onClick={() => navigate('/companies')} 
                className="w-100"
              >
                View All Companies
              </CButton>
            }
          />
        </CCol>
        
        <CCol sm={6} lg={4} className="mb-4">
          <CWidgetStatsF
            icon={<CIcon icon={cilGroup} height={24} />}
            title="Teams"
            value={stats.teams.toString()}
            color="warning"
            footer={
              <CButton 
                color="warning" 
                variant="outline" 
                onClick={() => navigate('/teams')} 
                className="w-100"
              >
                View All Teams
              </CButton>
            }
          />
        </CCol>
        
        <CCol sm={6} lg={4} className="mb-4">
          <CWidgetStatsF
            icon={<CIcon icon={cilUser} height={24} />}
            title="Employees"
            value={stats.employees.toString()}
            color="success"
            footer={
              <CButton 
                color="success" 
                variant="outline" 
                onClick={() => navigate('/employees')} 
                className="w-100"
              >
                View All Employees
              </CButton>
            }
          />
        </CCol>
        
        <CCol sm={6} lg={4} className="mb-4">
          <CWidgetStatsF
            icon={<CIcon icon={cilBasket} height={24} />}
            title="Customer Companies"
            value={stats.customerCompanies.toString()}
            color="danger"
            footer={
              <CButton 
                color="danger" 
                variant="outline" 
                onClick={() => navigate('/customer-companies')} 
                className="w-100"
              >
                View All Customer Companies
              </CButton>
            }
          />
        </CCol>
        
        <CCol sm={6} lg={4} className="mb-4">
          <CWidgetStatsF
            icon={<CIcon icon={cilPeople} height={24} />}
            title="Customer Contacts"
            value={stats.customerDetails.toString()}
            color="dark"
            footer={
              <CButton 
                color="dark" 
                variant="outline" 
                onClick={() => navigate('/customer-details')} 
                className="w-100"
              >
                View All Customer Contacts
              </CButton>
            }
          />
        </CCol>
        
        <CCol sm={6} lg={4} className="mb-4">
          <CWidgetStatsF
            icon={<CIcon icon={cilTask} height={24} />}
            title="Tasks"
            value={taskStats.total_tasks.toString()}
            color="info"
            footer={
              <CButton 
                color="info" 
                variant="outline" 
                onClick={() => navigate('/track-entries')} 
                className="w-100"
              >
                View All Tasks
              </CButton>
            }
          />
        </CCol>
      </CRow>
      
    
      
      {/* Recent Activities and Data */}
      <CRow>
        {/* Recent Employees */}
        <CCol lg={6} className="mb-4">
          <CCard className="h-100">
            <CCardHeader>
              <strong>Recent Employees</strong>
            </CCardHeader>
            <CCardBody>
              {recentEmployees.length > 0 ? (
                <CTable small hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Name</CTableHeaderCell>
                      <CTableHeaderCell>Position</CTableHeaderCell>
                      <CTableHeaderCell>Team</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {recentEmployees.map((employee) => (
                      <CTableRow key={employee.employee_id}>
                        <CTableDataCell>
                          {employee.first_name} {employee.last_name}
                        </CTableDataCell>
                        <CTableDataCell>{employee.position}</CTableDataCell>
                        <CTableDataCell>{employee.team_name}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              ) : (
                <div className="text-center py-3">No recent employees</div>
              )}
              <div className="text-center mt-3">
                <CButton color="primary" variant="outline" onClick={() => navigate('/employees')}>
                  View All Employees
                </CButton>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        
        {/* Recent Customers */}
        <CCol lg={6} className="mb-4">
          <CCard className="h-100">
            <CCardHeader>
              <strong>Recent Customer Companies</strong>
            </CCardHeader>
            <CCardBody>
              {recentCustomers.length > 0 ? (
                <CTable small hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Company Name</CTableHeaderCell>
                      <CTableHeaderCell>Industry</CTableHeaderCell>
                      <CTableHeaderCell>Contact</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {recentCustomers.map((company) => (
                      <CTableRow key={company.customer_company_id}>
                        <CTableDataCell>{company.name}</CTableDataCell>
                        <CTableDataCell>{company.industry}</CTableDataCell>
                        <CTableDataCell>{company.contact_email}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              ) : (
                <div className="text-center py-3">No recent customer companies</div>
              )}
              <div className="text-center mt-3">
                <CButton color="primary" variant="outline" onClick={() => navigate('/customer-companies')}>
                  View All Customer Companies
                </CButton>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Error Display */}
      {error && (
        <CCard className="mb-4 border-danger">
          <CCardBody className="text-danger">
            <strong>Error:</strong> {error}
          </CCardBody>
        </CCard>
      )}
    </div>
  );
};

export default Dashboard;

