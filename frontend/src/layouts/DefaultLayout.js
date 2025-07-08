import React, { useState, useEffect } from 'react';
import {
  CContainer,
  CSidebar,
  CSidebarBrand,
  CSidebarNav,
  CNavItem,
  CNavGroup,
  CHeader,
  CHeaderBrand,
  CHeaderNav,
  CNavLink,
  CNavTitle,
  CHeaderToggler,
  CButton,
  CFooter,
  CSpinner,
  CBadge,
  CAvatar,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CDropdownDivider,
  CTooltip,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilSpeedometer,
  cilBuilding,
  cilGroup,
  cilUser,
  cilBriefcase,
  cilPeople,
  cilNotes,
  cilAccountLogout,
  cilMenu,
  cilSettings,
  cilBell,
  cilEnvelopeOpen,
  cilBasket,
  cilGraph,
  cilInstitution,
  cilApps,
  cilCalendar,
  cilTask
} from '@coreui/icons';
import { Outlet, NavLink as RouterNavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../assets/scss/layout.scss';
import LogoImg from '../assets/images/logo-c2c.png';

const AppSidebar = ({ sidebarShow, setSidebarShow }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Check if the current path matches the given path exactly or is a direct child
  const isPathActive = (path) => {
    // Exact match
    if (location.pathname === path) {
      return true;
    }

    // Match for sub-paths, but not if there are other sub-paths that are more specific
    if (location.pathname.startsWith(path) && path !== '/projects') {
        return true;
    }


    return false;
  };
  
  // Handle direct navigation
  const handleNavigation = (path, event) => {
    if (event) {
      event.preventDefault();
    }
    navigate(path);
    if (window.innerWidth < 768) {
      setSidebarShow(false);
    }
  };

  // Create a custom nav item for better click handling
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
          <img
              src={LogoImg} // Path relative to the public folder
              alt="C2C Portal Logo"
              className="sidebar-brand-logo"
              height="110"// Use a single class for styling both
          />
        </div>
      </CSidebarBrand>
      
      <CSidebarNav className="sidebar-nav">
        <NavItem icon={cilSpeedometer} path="/dashboard">Dashboard</NavItem>
        
        <CNavTitle>Internal Management</CNavTitle>
        <NavItem icon={cilBuilding} path="/companies">Divisions</NavItem>
        <NavItem icon={cilGroup} path="/teams">Teams</NavItem>
        <NavItem icon={cilUser} path="/employees">Employees</NavItem>
        
        <CNavTitle clas>Project Management</CNavTitle>
        <NavItem icon={cilBriefcase} path="/projects">Projects</NavItem>
        <NavItem icon={cilGroup} path="/projects/teams">Project Teams</NavItem>
        <NavItem icon={cilBriefcase} path="/track-entries/dashboard">Track Sheet</NavItem>
        <NavItem icon={cilCalendar} path="/meetings">Meetings</NavItem>
        <NavItem icon={cilTask} path="/patch-movement">Patch Movement</NavItem>
        
        <CNavTitle>Customer Relationship</CNavTitle>
        <NavItem icon={cilBasket} path="/customer-companies">Customer Companies</NavItem>
        <NavItem icon={cilPeople} path="/customer-employees">Customer Employees</NavItem>
        <NavItem icon={cilPeople} path="/customer-details">Customer Contacts</NavItem>

        {user && (user.role === 'admin') && (
          <>
            <CNavTitle>Administration</CNavTitle>
            <NavItem icon={cilPeople} path="/users">User Management</NavItem>
          </>
        )}
      </CSidebarNav>

      {/* Optional Footer with Version Info */}
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

  // Create initials from user name or email
  const getUserInitials = () => {
    if (!user) return '?';
    
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    
    if (user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return '?';
  };

  return (
    <CHeader position="sticky" className="bg-light border-bottom">
      <CContainer fluid>
        <CHeaderToggler
          className="ps-1"
          onClick={() => setSidebarShow(!sidebarShow)}
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>

        
        <CHeaderNav className="ms-auto d-flex align-items-center">
          {/* User profile */}
          <CDropdown variant="nav-item">
            <CDropdownToggle className="py-0 d-flex align-items-center" caret={false}>
              {user?.profile_picture ? (
                <CAvatar src={`${(process.env.REACT_APP_API_URL || 'http://localhost:5000').replace('/api', '')}${user.profile_picture}`} className="ms-2" size="md" style={{ border: '2px solid #e0e0e0' }} />
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
  const currentYear = new Date().getFullYear();

  return (
    <CFooter className="border-top">
      <div>
        <span className="ms-1">&copy; {currentYear} C2C Portal</span>
      </div>
    </CFooter>
  );
};

const DefaultLayout = () => {
  const [sidebarShow, setSidebarShow] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default sidebar width

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarShow(false);
      } else {
        setSidebarShow(true);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="c2c-app-container">
      <AppSidebar sidebarShow={sidebarShow} setSidebarShow={setSidebarShow} />
      <div 
        className="wrapper d-flex flex-column min-vh-100 bg-light"
        style={{ 
          marginLeft: window.innerWidth >= 768 && sidebarShow ? `${sidebarWidth}px` : '0',
          transition: 'margin-left 0.3s',
          width: '100%'
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
