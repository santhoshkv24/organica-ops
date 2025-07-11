import React from 'react';
import { CContainer, CRow, CCol, CButton, CInputGroup, CFormInput, CInputGroupText } from '@coreui/react';
import { Link } from 'react-router-dom';
import CIcon from '@coreui/icons-react';
import { cilMagnifyingGlass } from '@coreui/icons';

const Page404 = () => {
  return (
    <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={6}>
            <div className="clearfix">
              <h1 className="float-start display-3 me-4">404</h1>
              <h4 className="pt-3">Oops! You're lost.</h4>
              <p className="text-medium-emphasis float-start">
                The page you are looking for was not found.
              </p>
            </div>
            {/* Optional: Add a search bar or link back home */}
            <CInputGroup className="input-prepend">
              <CInputGroupText>
                <CIcon icon={cilMagnifyingGlass} />
              </CInputGroupText>
              <CFormInput type="text" placeholder="What are you looking for?" />
              <CButton color="info">Search</CButton>
            </CInputGroup>
            <div className="text-center mt-3">
                <Link to="/dashboard">
                    <CButton color="primary">Go To Dashboard</CButton>
                </Link>
            </div>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
};

export default Page404;
