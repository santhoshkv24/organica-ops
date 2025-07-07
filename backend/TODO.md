# C2C Portal Backend - Database Redesign TODO List


## Stored Procedures to Delete
- [x] Delete `sp_CreateProjectTeam` (project_teams.sql)
- [x] Delete `sp_DeleteProjectTeam` (project_teams.sql)
- [x] Delete `sp_GetProjectTeams` (project_teams.sql)
- [x] Delete `sp_GetProjectsByTeam` (project_teams.sql)
- [x] Delete `sp_CreateProjectAssignment` (projects.sql)
- [x] Delete `sp_UpdateProjectAssignment` (projects.sql)
- [x] Delete `sp_DeleteProjectAssignment` (projects.sql)
- [x] Delete `sp_GetProjectAssignments` (projects.sql)
- [x] Delete `sp_GetEmployeeAssignments` (projects.sql)

## Stored Procedures to Update
- [x] Update `sp_CreateProject` to include project_manager_id
- [x] Update `sp_UpdateProject` to include project_manager_id
- [x] Update `sp_GetProjectById` to include project manager details
- [x] Update `sp_GetProjects` to include project manager details

## New Stored Procedures to Create
- [x] `sp_CreateProjectTeamMember` - Add a member to a project team
- [x] `sp_UpdateProjectTeamMember` - Update a project team member's role
- [x] `sp_DeleteProjectTeamMember` - Remove a member from a project team
- [x] `sp_GetProjectTeamMembers` - Get all members of a project team
- [x] `sp_GetEmployeeProjects` - Get all projects an employee is part of
- [x] `sp_CreateCustomerEmployee` - Add a customer employee
- [x] `sp_UpdateCustomerEmployee` - Update a customer employee
- [x] `sp_DeleteCustomerEmployee` - Delete a customer employee
- [x] `sp_GetCustomerEmployees` - Get all employees of a customer company
- [x] `sp_CreateCustomerTrackEntry` - Create a task for a customer employee
- [x] `sp_UpdateCustomerTrackEntry` - Update a customer task
- [x] `sp_GetCustomerTrackEntries` - Get tasks assigned to customer employees

## Controllers to Update
- [x] Update `projectController.js` to use new project structure
- [x] Update `trackEntryController.js` to use new track entries structure
- [x] Remove `projectTeamController.js` and `projectAssignmentController.js`
- [x] Create `projectTeamMemberController.js` for managing project team members
- [x] Create `customerEmployeeController.js` for managing customer employees
- [x] Create `customerTrackEntryController.js` for managing customer tasks

## Routes to Update
- [x] Update `projectRoutes.js` to use new project endpoints
- [x] Update `trackEntryRoutes.js` to use new track entry endpoints
- [x] Remove `projectTeamRoutes.js` and `projectAssignmentRoutes.js`
- [x] Create `projectTeamMemberRoutes.js` for project team member endpoints
- [x] Create `customerEmployeeRoutes.js` for customer employee endpoints
- [x] Create `customerTrackEntryRoutes.js` for customer task endpoints

## Authentication and Authorization
- [x] Update `authMiddleware.js` to include new roles (customer_head, customer_employee)
- [x] Update `authController.js` to handle customer user registration and login
- [x] Add role-based access control for customer users

## Functional Backend Endpoints

### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/change-password` - Change user password
- `PUT /api/auth/first-time-password` - Set first-time password

### Branch Endpoints
- `GET /api/branches` - Get all branches
- `GET /api/branches/:id` - Get branch by ID
- `POST /api/branches` - Create new branch
- `PUT /api/branches/:id` - Update branch
- `DELETE /api/branches/:id` - Delete branch

### Team Endpoints
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team by ID
- `POST /api/teams` - Create new team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `GET /api/teams/branch/:branchId` - Get teams by branch
- `GET /api/teams/:teamId/members` - Get team members
- `GET /api/teams/:teamId/leads` - Get team leads
- `POST /api/teams/:teamId/leads` - Assign team lead
- `DELETE /api/teams/leads/:teamLeadId` - Remove team lead

### Employee Endpoints
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/employees/team/:teamId` - Get employees by team
- `GET /api/employees/branch/:branchId` - Get employees by branch

### User Endpoints
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/profile-picture` - Update user profile picture

### Project Endpoints
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/team/:teamId` - Get projects by team
- `GET /api/projects/manager/:managerId` - Get projects by manager

### Project Team Member Endpoints
- `POST /api/project-team-members` - Add member to project team
- `PUT /api/project-team-members/:id` - Update project team member role
- `DELETE /api/project-team-members/:id` - Remove member from project team
- `GET /api/project-team-members/project/:projectId` - Get project team members
- `GET /api/project-team-members/employee/:employeeId` - Get employee projects
- `GET /api/project-team-members/project/:projectId/role` - Get team members by role

### Meeting Endpoints
- `GET /api/meetings` - Get all meetings
- `GET /api/meetings/:id` - Get meeting by ID
- `POST /api/meetings` - Create new meeting
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting
- `GET /api/meetings/employee/:employeeId` - Get meetings by employee
- `GET /api/meetings/team/:teamId` - Get meetings by team
- `GET /api/meetings/project/:projectId` - Get meetings by project

### Customer Company Endpoints
- `GET /api/customer-companies` - Get all customer companies
- `GET /api/customer-companies/:id` - Get customer company by ID
- `POST /api/customer-companies` - Create new customer company
- `PUT /api/customer-companies/:id` - Update customer company
- `DELETE /api/customer-companies/:id` - Delete customer company

### Customer Details Endpoints
- `GET /api/customer-details` - Get all customer details
- `GET /api/customer-details/:id` - Get customer details by ID
- `POST /api/customer-details` - Create new customer details
- `PUT /api/customer-details/:id` - Update customer details
- `DELETE /api/customer-details/:id` - Delete customer details
- `GET /api/customer-details/company/:companyId` - Get customer details by company

### Customer Employee Endpoints
- `POST /api/customer-employees` - Create new customer employee
- `GET /api/customer-employees/:id` - Get customer employee by ID
- `PUT /api/customer-employees/:id` - Update customer employee
- `DELETE /api/customer-employees/:id` - Delete customer employee
- `GET /api/customer-employees/company/:customerCompanyId` - Get employees by customer company

### Track Entry Endpoints
- `GET /api/track-entries` - Get all track entries with filters
- `POST /api/track-entries` - Create new track entry
- `GET /api/track-entries/:id` - Get track entry by ID
- `PUT /api/track-entries/:id` - Update track entry
- `DELETE /api/track-entries/:id` - Delete track entry
- `GET /api/track-entries/dashboard/summary` - Get dashboard summary
- `GET /api/track-entries/statistics` - Get task statistics
- `GET /api/track-entries/assignable-employees` - Get assignable employees
- `GET /api/track-entries/assigned-by/:assignedById` - Get tasks by assigner
- `GET /api/track-entries/employee/:employeeId` - Get tasks by employee
- `PUT /api/track-entries/:id/status` - Update task status
- `POST /api/track-entries/:id/log-hours` - Log hours worked

### Customer Track Entry Endpoints
- `GET /api/customer-track-entries` - Get all customer track entries with filters
- `POST /api/customer-track-entries` - Create new customer track entry
- `GET /api/customer-track-entries/:id` - Get customer track entry by ID
- `PUT /api/customer-track-entries/:id` - Update customer track entry
- `DELETE /api/customer-track-entries/:id` - Delete customer track entry
- `PUT /api/customer-track-entries/:id/status` - Update customer task status
 