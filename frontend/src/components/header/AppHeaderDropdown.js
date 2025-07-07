import React from 'react';
import {
  CAvatar,
  CBadge,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react';
import {
  cilBell,
  cilCreditCard,
  cilCommentSquare,
  cilEnvelopeOpen,
  cilFile,
  cilLockLocked,
  cilSettings,
  cilTask,
  cilUser,
  cilAccountLogout,
} from '@coreui/icons';
import CIcon from '@coreui/icons-react';

import { useAuth } from '../../contexts/AuthContext';

const AppHeaderDropdown = () => {
  const { user, logout } = useAuth();

  // Function to get profile picture URL
  const getProfilePictureUrl = () => {
    if (!user || !user.profile_picture) {
      return 'https://ui-avatars.com/api/?name=' + (user?.username?.charAt(0) || 'U') + '&size=200&background=f0f0f0&color=666';
    }

    // If the profile picture is already a full URL, use it directly
    if (user.profile_picture.startsWith('http')) {
      return user.profile_picture;
    }

    // Otherwise, prepend the API URL
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${user.profile_picture}`;
  };

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0" caret={false}>
        <CAvatar 
          src={getProfilePictureUrl()} 
          size="md" 
          status="success"
          onError={(e) => {
            console.error('Error loading profile image in header');
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${user?.username?.charAt(0) || 'U'}&size=200&background=f0f0f0&color=666`;
          }}
        />
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-light fw-semibold py-2">Account</CDropdownHeader>
        <CDropdownItem href="#/profile">
          <CIcon icon={cilUser} className="me-2" />
          Profile
        </CDropdownItem>
        <CDropdownItem href="#/profile/password">
          <CIcon icon={cilLockLocked} className="me-2" />
          Change Password
        </CDropdownItem>
        <CDropdownItem href="#/profile/settings">
          <CIcon icon={cilSettings} className="me-2" />
          Settings
        </CDropdownItem>
        <CDropdownDivider />
        <CDropdownItem onClick={logout}>
          <CIcon icon={cilAccountLogout} className="me-2" />
          Logout
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  );
};

export default AppHeaderDropdown; 