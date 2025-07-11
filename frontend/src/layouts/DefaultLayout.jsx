import React, { useState, useEffect } from 'react';
import {
  CContainer,
  CSidebar,
  CSidebarBrand,
  CSidebarNav,
  CNavTitle,
  CHeader,
  CHeaderToggler,
  CHeaderNav,
  CFooter,
  CAvatar,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CDropdownDivider,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilSpeedometer,
  cilBuilding,
  cilGroup,
  cilUser,
  cilBriefcase,
  cilPeople,
  cilBasket,
  cilCalendar,
  cilTask,
  cilMemory,
  cilAccountLogout,
  cilMenu,
} from '@coreui/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../assets/scss/layout.scss';
import LogoImg from '../assets/images/logo-c2c.png';

const AppSidebar = ({ sidebarShow, setSidebarShow }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isPathActive = (path) => {
    if (location.pathname === path) return true;
    if (location.pathname.startsWith(path) && path !== '/projects') return true;
    return false;
  };

  const handleNavigation = (path, event) => {
    if (event) event.preventDefault();
    navigate(path);
    if (window.innerWidth < 768) setSidebarShow(false);
  };

  const NavItem = ({ icon, path, children }) => (
    <div
      className={`nav-item d-flex ${isPathActive(path) ? 'active' : ''}`}
      onClick={(e) => handleNavigation(path, e)}
      style={{ cursor: 'pointer' }}
    >
      <div className="d-flex align-items-center w-100 px-3 py-2">
        <CIcon icon={icon} className="nav-icon me-3" />
        <span>{children}</span>
      </div>
    </div>
  );

  return (
    <CSidebar
      position="fixed"
      visible={sidebarShow}
      onVisibleChange={(visible) => setSidebarShow(visible)}
      unfoldable={false}
      className="c2c-sidebar"
    >
      <CSidebarBrand className="d-none d-md-flex">
        <div className="sidebar-brand-full">
          <img src={LogoImg} alt="C2C Portal Logo" className="sidebar-brand-logo" height="110" />
        </div>
      </CSidebarBrand>

      <CSidebarNav className="sidebar-nav">
        <NavItem icon={cilSpeedometer} path="/dashboard">Dashboard</NavItem>

        <CNavTitle>Internal Management</CNavTitle>
        <NavItem icon={cilBuilding} path="/companies">Divisions</NavItem>
        <NavItem icon={cilGroup} path="/teams">Teams</NavItem>
        <NavItem icon={cilUser} path="/employees">Employees</NavItem>

        <CNavTitle>Project Management</CNavTitle>
        <NavItem icon={cilBriefcase} path="/projects">Projects</NavItem>
        <NavItem icon={cilGroup} path="/projects/teams">Project Teams</NavItem>
        <NavItem icon={cilBriefcase} path="/track-entries/dashboard">Track Sheet</NavItem>
        <NavItem icon={cilCalendar} path="/meetings">Meetings</NavItem>
        <NavItem icon={cilTask} path="/patch-movement">Patch Movement</NavItem>
        <NavItem icon={cilMemory} path="/inventory-loans">Inventory Loan</NavItem>

        <CNavTitle>Customer Relationship</CNavTitle>
        <NavItem icon={cilBasket} path="/customer-companies">Customer Companies</NavItem>
        <NavItem icon={cilPeople} path="/customer-employees">Customer Employees</NavItem>
        <NavItem icon={cilPeople} path="/customer-details">Customer Contacts</NavItem>

        {user?.role === 'admin' && (
          <>
            <CNavTitle>Administration</CNavTitle>
            <NavItem icon={cilPeople} path="/users">User Management</NavItem>
          </>
        )}
      </CSidebarNav>

      <div className="sidebar-footer">
        <small>v1.1</small>
      </div>
    </CSidebar>
  );
};

const AppHeader = ({ sidebarShow, setSidebarShow }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserInitials = () => {
    if (!user) return '?';
    if (user.first_name && user.last_name) return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    if (user.username) return user.username[0].toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return '?';
  };

  return (
    <CHeader position="sticky" className="bg-light border-bottom">
      <CContainer fluid>
        <CHeaderToggler className="ps-1" onClick={() => setSidebarShow(!sidebarShow)}>
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>

        <CHeaderNav className="ms-auto d-flex align-items-center">
          <CDropdown variant="nav-item">
            <CDropdownToggle className="py-0 d-flex align-items-center" caret={false}>
              {user?.profile_picture ? (
                <CAvatar
                  src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api', '')}${user.profile_picture}`}
                  className="ms-2"
                  size="md"
                  style={{ border: '2px solid #e0e0e0' }}
                />
              ) : (
                <CAvatar color="secondary" textColor="light" className="ms-2" size="md">
                  {getUserInitials()}
                </CAvatar>
              )}
            </CDropdownToggle>
            <CDropdownMenu className="pt-0" placement="bottom-end">
              <CDropdownItem onClick={() => navigate('/profile')}>
                <CIcon icon={cilUser} className="me-2" />
                Profile
              </CDropdownItem>
              <CDropdownDivider />
              <CDropdownItem onClick={handleLogout}>
                <CIcon icon={cilAccountLogout} className="me-2" />
                Logout
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
        </CHeaderNav>
      </CContainer>
    </CHeader>
  );
};

const AppFooter = () => {
  return (
    <CFooter className="border-top">
      <div>
        <span className="ms-1">&copy; {new Date().getFullYear()} C2C Portal</span>
      </div>
    </CFooter>
  );
};

const DefaultLayout = () => {
  const [sidebarShow, setSidebarShow] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(256);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarShow(false);
      } else {
        setSidebarShow(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="c2c-app-container">
      <AppSidebar sidebarShow={sidebarShow} setSidebarShow={setSidebarShow} />
      <div
        className="wrapper d-flex flex-column min-vh-100 bg-light"
        style={{
          marginLeft: window.innerWidth >= 768 && sidebarShow ? `${sidebarWidth}px` : '0',
          transition: 'margin-left 0.3s',
          width: '100%',
        }}
      >
        <AppHeader sidebarShow={sidebarShow} setSidebarShow={setSidebarShow} />
        <div className="body flex-grow-1 px-sm-3 px-2 py-3">
          <CContainer fluid>
            <Outlet />
          </CContainer>
        </div>
        <AppFooter />
      </div>
    </div>
  );
};

export default DefaultLayout;