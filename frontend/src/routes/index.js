import React, { Suspense } from 'react';
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './ProtectedRoute'; // Import protection components

// Layouts
const DefaultLayout = React.lazy(() => import('../layouts/DefaultLayout'));

// Pages
const Login = React.lazy(() => import('../views/auth/Login'));
const Register = React.lazy(() => import('../views/auth/Register'));
const Page404 = React.lazy(() => import('../views/pages/Page404'));
const Page500 = React.lazy(() => import('../views/pages/Page500'));

// Views - Components
const Dashboard = React.lazy(() => import('../views/dashboard/Dashboard'));
const Companies = React.lazy(() => import('../views/companies/Companies'));
const CompanyForm = React.lazy(() => import('../views/companies/CompanyForm'));
const Departments = React.lazy(() => import('../views/departments/Departments'));
const DepartmentForm = React.lazy(() => import('../views/departments/DepartmentForm'));
const Teams = React.lazy(() => import('../views/teams/Teams'));
const TeamForm = React.lazy(() => import('../views/teams/TeamForm'));
const Employees = React.lazy(() => import('../views/employees/Employees'));
const EmployeeForm = React.lazy(() => import('../views/employees/EmployeeForm'));
const CustomerCompanies = React.lazy(() => import('../views/customer-companies/CustomerCompanies'));
const CustomerCompanyForm = React.lazy(() => import('../views/customer-companies/CustomerCompanyForm'));
const CustomerDetails = React.lazy(() => import('../views/customer-details/CustomerDetails'));
const CustomerDetailForm = React.lazy(() => import('../views/customer-details/CustomerDetailForm'));

const AppRoutes = () => {
  // Basic loading spinner
  const loading = (
    <div className="pt-3 text-center">
      <div className="sk-spinner sk-spinner-pulse"></div>
    </div>
  );

  return (
    <HashRouter>
      <Suspense fallback={loading}>
        <Routes>
          <Route exact path="/login" name="Login Page" element={<Login />} />
          <Route exact path="/register" name="Register Page" element={<Register />} />
          <Route exact path="/404" name="Page 404" element={<Page404 />} />
          <Route exact path="/500" name="Page 500" element={<Page500 />} />

          {/* Protected Routes - Require Login */}
          <Route path="/" element={<ProtectedRoute><DefaultLayout /></ProtectedRoute>}>
            {/* Redirect base path to dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" name="Dashboard" element={<Dashboard />} />

            {/* Standard User Routes (View Lists) */}
            <Route path="companies" name="Companies" element={<Companies />} />
            <Route path="departments" name="Departments" element={<Departments />} />
            <Route path="teams" name="Teams" element={<Teams />} />
            <Route path="employees" name="Employees" element={<Employees />} />
            <Route path="customer-companies" name="Customer Companies" element={<CustomerCompanies />} />
            <Route path="customer-details" name="Customer Details" element={<CustomerDetails />} />

            {/* Admin Only Routes (Create/Edit Forms) */}
            <Route path="companies/create" name="Create Company" element={<AdminRoute><CompanyForm /></AdminRoute>} />
            <Route path="companies/:id/edit" name="Edit Company" element={<AdminRoute><CompanyForm /></AdminRoute>} />
            <Route path="departments/create" name="Create Department" element={<AdminRoute><DepartmentForm /></AdminRoute>} />
            <Route path="departments/:id/edit" name="Edit Department" element={<AdminRoute><DepartmentForm /></AdminRoute>} />
            <Route path="teams/create" name="Create Team" element={<AdminRoute><TeamForm /></AdminRoute>} />
            <Route path="teams/:id/edit" name="Edit Team" element={<AdminRoute><TeamForm /></AdminRoute>} />
            <Route path="employees/create" name="Create Employee" element={<AdminRoute><EmployeeForm /></AdminRoute>} />
            <Route path="employees/:id/edit" name="Edit Employee" element={<AdminRoute><EmployeeForm /></AdminRoute>} />
            <Route path="customer-companies/create" name="Create Customer Company" element={<AdminRoute><CustomerCompanyForm /></AdminRoute>} />
            <Route path="customer-companies/:id/edit" name="Edit Customer Company" element={<AdminRoute><CustomerCompanyForm /></AdminRoute>} />
            <Route path="customer-details/create" name="Create Customer Detail" element={<AdminRoute><CustomerDetailForm /></AdminRoute>} />
            <Route path="customer-details/:id/edit" name="Edit Customer Detail" element={<AdminRoute><CustomerDetailForm /></AdminRoute>} />

            {/* Catch-all for unmatched routes within the protected layout - redirect to dashboard or 404 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Fallback for any other route not matched */}
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
};

export default AppRoutes;

