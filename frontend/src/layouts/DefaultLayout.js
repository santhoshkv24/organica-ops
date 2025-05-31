import React from 'react';
import { CContainer, CSidebar, CSidebarBrand, CSidebarNav, CNavItem, CHeader, CHeaderBrand, CHeaderNav, CNavLink, CNavTitle, CHeaderToggler, CButton } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSpeedometer, cilBuilding, cilGroup, cilUser, cilBriefcase, cilPeople, cilNotes, cilAccountLogout } from '@coreui/icons';
import { Outlet, NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

const AppSidebar = () => {
  // Basic sidebar visibility state (can be managed globally if needed)
  const [sidebarVisible, setSidebarVisible] = React.useState(true);

  return (
    <CSidebar 
      position="fixed" 
      visible={sidebarVisible}
      onVisibleChange={(visible) => setSidebarVisible(visible)}
    >
      <CSidebarBrand>C2C Portal</CSidebarBrand>
      <CSidebarNav>
        <CNavItem component={RouterNavLink} to="/dashboard">
          <CIcon customClassName="nav-icon" icon={cilSpeedometer} />
          Dashboard
        </CNavItem>
        <CNavTitle>Management</CNavTitle>
        <CNavItem component={RouterNavLink} to="/companies">
          <CIcon customClassName="nav-icon" icon={cilBuilding} />
          Companies
        </CNavItem>
        <CNavItem component={RouterNavLink} to="/departments">
          <CIcon customClassName="nav-icon" icon={cilBriefcase} />
          Departments
        </CNavItem>
        <CNavItem component={RouterNavLink} to="/teams">
          <CIcon customClassName="nav-icon" icon={cilGroup} />
          Teams
        </CNavItem>
        <CNavItem component={RouterNavLink} to="/employees">
          <CIcon customClassName="nav-icon" icon={cilUser} />
          Employees
        </CNavItem>
        <CNavTitle>Customers</CNavTitle>
        <CNavItem component={RouterNavLink} to="/customer-companies">
          <CIcon customClassName="nav-icon" icon={cilBuilding} />
          Customer Companies
        </CNavItem>
        <CNavItem component={RouterNavLink} to="/customer-details">
          <CIcon customClassName="nav-icon" icon={cilPeople} />
          Customer Details
        </CNavItem>
      </CSidebarNav>
      {/* <CSidebarToggler /> Optional Toggler */}
    </CSidebar>
  );
};

const AppHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirect to login after logout
  };

  return (
    <CHeader position="sticky" className="mb-4">
      <CContainer fluid>
        {/* Optional: Add toggler for sidebar if needed */}
        {/* <CHeaderToggler className="ps-1" onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })} /> */}
        <CHeaderBrand href="#">C2C Portal</CHeaderBrand>
        <CHeaderNav className="ms-auto">
          {user && (
            <CNavItem className="d-flex align-items-center me-3">
              <span className="me-2">Welcome, {user.username || user.email}</span> {/* Adjust based on user object */}
            </CNavItem>
          )}
          <CNavItem>
            <CButton color="light" variant="outline" onClick={handleLogout}>
              <CIcon icon={cilAccountLogout} className="me-2" />
              Logout
            </CButton>
          </CNavItem>
        </CHeaderNav>
      </CContainer>
    </CHeader>
  );
};

const AppContent = () => {
  return (
    <CContainer lg>
      <Outlet /> {/* Child routes will render here */}
    </CContainer>
  );
};

const DefaultLayout = () => {
  return (
    <div>
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100 bg-light">
        <AppHeader />
        <div className="body flex-grow-1 px-3">
          <AppContent />
        </div>
        {/* <AppFooter /> Optional Footer */}
      </div>
    </div>
  );
};

export default DefaultLayout;

