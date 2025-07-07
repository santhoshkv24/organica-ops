import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cilPlus } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CSpinner,
  CAlert,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CFormInput,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from '@coreui/react';
import { 
  cilSearch, 
  cilOptions,
  cilUserPlus,
  cilUser,
  cilPeople,
  cilReload
} from '@coreui/icons';
import StaticGrid from '../../components/StaticGrid';
import { 
  getCustomerCompanies,
  getCustomerEmployees,
  createCustomerEmployee,
  updateCustomerEmployee,
  deleteCustomerEmployee
} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const CustomerEmployees = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isCustomerHead = user?.role === 'customer_head';
  
  const gridRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [activeTab, setActiveTab] = useState('employees');
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const companiesResponse = await getCustomerCompanies();
        const companiesData = companiesResponse.data || [];
        setCompanies(companiesData);
        if (companiesData.length > 0) {
          const companyId = companiesData[0].customer_company_id;
          setSelectedCompany(companyId);
          fetchEmployees(companyId);
        }
      } catch (err) {
        setError('Failed to load initial data.');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const fetchEmployees = async (companyId) => {
    if (!companyId) return;
    try {
      setLoading(true);
      const employeesResponse = await getCustomerEmployees(companyId);
      setEmployees(employeesResponse.data || []);
    } catch (err) {
      setError('Failed to load employees for the selected company.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCompany) {
      fetchEmployees(selectedCompany);
    }
  }, [selectedCompany]);

  const handleSaveEmployee = async (updates) => {
    try {
      if (updates.new.length > 0) {
        for (const employee of updates.new) {
          // Set is_head based on active tab
          const employeeData = {
            ...employee,
            customer_company_id: selectedCompany,
            is_head: activeTab === 'team-heads' // true for team heads, false for team members
          };
          await createCustomerEmployee(employeeData);
        }
      }
      if (updates.updated.length > 0) {
        for (const employee of updates.updated) {
          // Ensure is_head is not changed when updating existing employees
          const { is_head, ...employeeData } = employee;
          await updateCustomerEmployee(employee.id, {
            ...employeeData,
            customer_company_id: selectedCompany
          });
        }
      }
      fetchEmployees(selectedCompany);
    } catch (err) {
      console.error('Error saving employee:', err);
      setError(err.response?.data?.message || 'Failed to save changes.');
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    try {
      await deleteCustomerEmployee(employeeId);
      fetchEmployees(selectedCompany);
    } catch (err) {
      setError('Failed to delete employee.');
    }
  };

  const columns = [
    { key: 'first_name', label: 'First Name', type: 'text', placeholder: 'First Name' },
    { key: 'last_name', label: 'Last Name', type: 'text', placeholder: 'Last Name' },
    { key: 'email', label: 'Email', type: 'text', placeholder: 'Email' },
    { key: 'phone', label: 'Phone', type: 'text', placeholder: 'Phone' },
    { key: 'position', label: 'Position', type: 'text', placeholder: 'Position' },
  ];

  const filteredEmployees = employees.filter(emp => {
    const tabCondition = activeTab === 'team-heads' ? emp.is_head : !emp.is_head;
    const searchCondition = searchTerm ? 
      Object.values(emp).some(val => 
        val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
      ) : true;
    return tabCondition && searchCondition;
  });

  return (
    <div className="customer-employees">
      <CCard>
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <CIcon icon={activeTab === 'team-heads' ? cilUser : cilPeople} className="me-2" />
              {activeTab === 'team-heads' ? 'Customer Team Heads' : 'Customer Employees'}
            </h5>
            <div className="d-flex gap-2">
              {(isAdmin || isManager) && companies.length > 1 && (
                <CFormSelect 
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  style={{ width: '250px' }}
                  disabled={isCustomerHead}
                >
                  {companies.map(company => (
                    <option key={company.customer_company_id} value={company.customer_company_id}>
                      {company.name}
                    </option>
                  ))}
                </CFormSelect>
              )}
              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </CInputGroup>
              <CDropdown>
                <CDropdownToggle color="primary" variant="outline">
                  <CIcon icon={cilOptions} />
                </CDropdownToggle>
                <CDropdownMenu>
                  <CDropdownItem onClick={() => setSearchTerm('')}>
                    Clear Search
                  </CDropdownItem>
                  <CDropdownItem onClick={() => fetchEmployees(selectedCompany)}>
                    <CIcon icon={cilReload} className="me-2" /> Refresh
                  </CDropdownItem>
                  {(isAdmin || isManager || isCustomerHead) && (
                    <CDropdownItem onClick={() => gridRef.current?.handleAddRow()}>
                      <CIcon icon={cilUserPlus} className="me-2" /> Add New
                    </CDropdownItem>
                  )}
                </CDropdownMenu>
              </CDropdown>
            </div>
          </div>
        </CCardHeader>
        <CCardBody>
          {error && <CAlert color="danger">{error}</CAlert>}
          <CNav variant="tabs">
            <CNavItem>
              <CNavLink active={activeTab === 'employees'} onClick={() => setActiveTab('employees')}>
                <CIcon icon={cilPeople} className="me-2" />
                Team Members
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink active={activeTab === 'team-heads'} onClick={() => setActiveTab('team-heads')}>
                <CIcon icon={cilUser} className="me-2" />
                Team Heads
              </CNavLink>
            </CNavItem>
          </CNav>
          <CTabContent>
            <CTabPane visible={true}>
              <div className="mt-3">
                <CButton 
                  color="primary" 
                  size="sm" 
                  className="mb-3"
                  onClick={() => gridRef.current?.handleAddRow()}
                  disabled={!selectedCompany}
                >
                  <CIcon icon={cilPlus} className="me-1" />
                  Add {activeTab === 'team-heads' ? 'Team Head' : 'Team Member'}
                </CButton>
                <StaticGrid
                  ref={gridRef}
                  data={filteredEmployees}
                  columns={columns}
                  loading={loading}
                  onSave={handleSaveEmployee}
                  onDelete={handleDeleteEmployee}
                  emptyMessage="No employees found for this selection."
                  idField="customer_employee_id"
                  newRowDefaults={{
                    is_head: activeTab === 'team-heads',
                    customer_company_id: selectedCompany
                  }}
                />
              </div>
            </CTabPane>
          </CTabContent>
        </CCardBody>
      </CCard>
    </div>
  );
};

export default CustomerEmployees;