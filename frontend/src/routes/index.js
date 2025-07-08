import React, { Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { 
  ProtectedRoute, 
  AdminRoute, 
  ProjectManagerRoute, 
  TeamLeadRoute, 
  ManagerOrTeamLeadRoute,
  CustomerTeamsHeadRoute,
  CustomerTeamMemberRoute,
  EmployeeRoute
} from './ProtectedRoute';

// Lazy-loaded components...
const DefaultLayout = React.lazy(() => import('../layouts/DefaultLayout'));
const Login = React.lazy(() => import('../views/auth/Login'));
const Register = React.lazy(() => import('../views/auth/Register'));
const ForgotPassword = React.lazy(() => import('../views/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('../views/auth/ResetPassword'));
const FirstTimePassword = React.lazy(() => import('../views/auth/FirstTimePassword'));
const Page404 = React.lazy(() => import('../views/pages/Page404'));
const Page500 = React.lazy(() => import('../views/pages/Page500'));

// Main app views
const Dashboard = React.lazy(() => import('../views/dashboard/Dashboard'));
const Companies = React.lazy(() => import('../views/companies/Companies'));
const Teams = React.lazy(() => import('../views/teams/Teams'));
const EmployeeDetails = React.lazy(() => import('../views/employees/EmployeeDetails'));
const CustomerCompanies = React.lazy(() => import('../views/customer-companies/CustomerCompanies'));
const CustomerEmployees = React.lazy(() => import('../views/customer-employees/CustomerEmployees'));
const CustomerDetails = React.lazy(() => import('../views/customer-details/CustomerDetails'));
const Users = React.lazy(() => import('../views/admin/Users'));
const ProfilePicture = React.lazy(() => import('../views/profile/ProfilePicture'));
const Meetings = React.lazy(() => import('../views/meetings/Meetings'));
const Projects = React.lazy(() => import('../views/projects/Projects'));
const ProjectForm = React.lazy(() => import('../views/projects/ProjectForm'));
const ProjectTeams = React.lazy(() => import('../views/project-teams/ProjectTeams'));
const PatchMovement = React.lazy(() => import('../views/patch-movement/PatchMovement'));
const TrackEntryForm = React.lazy(() => import('../views/track-entries/TrackEntryForm'));
const TrackEntryDashboard = React.lazy(() => import('../views/track-entries/TrackEntryDashboard'));
const ProjectsMuiView = React.lazy(() => import('../views/mui-test/test'))

const AppRoutes = () => {
  const loading = (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="spinner"></div>
    </div>
  );

  return (
    <Suspense fallback={loading}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/set-password" element={<ProtectedRoute><FirstTimePassword /></ProtectedRoute>} />
        <Route path="/404" element={<Page404 />} />
        <Route path="/500" element={<Page500 />} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><DefaultLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Organization Management */}
          <Route path="companies" element={<EmployeeRoute><Companies /></EmployeeRoute>} />
          <Route path="teams" element={<EmployeeRoute><Teams /></EmployeeRoute>} />
          <Route path="employees" element={<EmployeeRoute><EmployeeDetails /></EmployeeRoute>} />
          <Route path="employees/:id" element={<EmployeeRoute><EmployeeDetails /></EmployeeRoute>} />
          
          {/* Customer Management */}
          <Route path="customer-companies" element={<EmployeeRoute><CustomerCompanies /></EmployeeRoute>} />
          <Route path="customer-employees" element={<ProjectManagerRoute><CustomerEmployees /></ProjectManagerRoute>} />
          <Route path="customer-details" element={<EmployeeRoute><CustomerDetails /></EmployeeRoute>} />

          {/* Project Management */}
          <Route path="projects/mui" element={<ProjectsMuiView />} />
          <Route path="projects" element={<EmployeeRoute><Projects /></EmployeeRoute>} />
          <Route path="projects/create" element={<ProjectManagerRoute><ProjectForm /></ProjectManagerRoute>} />
          <Route path="projects/edit/:id" element={<ProjectManagerRoute><ProjectForm /></ProjectManagerRoute>} />
          <Route path="projects/teams" element={<EmployeeRoute><ProjectTeams /></EmployeeRoute>} />
          <Route path="projects/teams/:projectId" element={<ProjectManagerRoute><ProjectTeams /></ProjectManagerRoute>} />
          <Route path="meetings" element={<EmployeeRoute><Meetings /></EmployeeRoute>} />
          <Route path="patch-movement" element={<EmployeeRoute><PatchMovement /></EmployeeRoute>} />
          
          {/* Track Entries */}
          <Route path="track-entries">
            <Route path="create" element={
              <ManagerOrTeamLeadRoute>
                <TrackEntryForm />
              </ManagerOrTeamLeadRoute>
            } />
            <Route path="edit/:id" element={
              <ManagerOrTeamLeadRoute>
                <TrackEntryForm />
              </ManagerOrTeamLeadRoute>
            } />
            <Route path="dashboard" element={<ProtectedRoute><TrackEntryDashboard /></ProtectedRoute>} />
          </Route>

          {/* Admin routes */}
          <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
          
          {/* Profile routes */}
          <Route path="profile" element={<ProfilePicture />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Catch all routes */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
