import React from 'react';
import { CContainer, CRow, CCol, CButton } from '@coreui/react';
import { Link } from 'react-router-dom';

const Page500 = () => {
  return (
    <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={6}>
            <div className="clearfix">
              <h1 className="float-start display-3 me-4">500</h1>
              <h4 className="pt-3">Houston, we have a problem!</h4>
              <p className="text-medium-emphasis float-start">
                The page you are looking for is temporarily unavailable.
              </p>
            </div>
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

export default Page500; 