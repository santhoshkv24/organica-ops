# Frontend TODO List

## Core Components Updates

1. **AuthContext.js**
   - Update role-based permissions to include new roles (Customer Teams Head, Customer Team Member)
   - Add role-specific access control helpers

2. **API Service Updates**
   - Add new endpoints for project team management
   - Add customer team management endpoints
   - Update track entry endpoints to support the new workflow

3. **Component Enhancements**
   - Update DataGrid, FormGrid, and ResizableGrid to support role-based visibility
   - Enhance EnhancedForm to conditionally render fields based on user role
   - Update FormBuilder to support dynamic field rendering based on permissions

## New Pages & Features

1. **Project Team Management**
   - Create ProjectTeams.js view for managing project teams
   - Implement UI for adding/removing team members and team leads to projects
   - Add role assignment functionality within project teams

2. **Customer Team Management**
   - Create CustomerTeams.js view for customer team management
   - Implement UI for Customer Teams Head to manage their team members
   - Add customer team member assignment interface

3. **Track Entry Workflow Updates**
   - Update TrackEntries.js to filter tasks based on role permissions
   - Modify TrackEntryForm.js to implement role-based task assignment:
     - Project Manager: Can assign to any team member or team lead in project
     - Team Lead: Can assign only to their team members in project
     - Customer Teams Head: Can assign only to their customer team members
   - Update TrackEntryDashboard.js to show relevant metrics based on role

4. **Role-Based Navigation**
   - Update navigation menu to show only relevant options based on user role
   - Create role-specific dashboard views

## UI/UX Improvements

1. **Task Assignment Flow**
   - Create visual indicators for task assignment paths
   - Implement clear UI for distinguishing between internal and customer tasks

2. **Team Visualization**
   - Create team structure visualization component
   - Implement project team composition view

3. **Status Tracking**
   - Enhance status tracking UI to show task history
   - Add visual workflow indicators

## Implementation Plan

### Phase 1: Core Infrastructure
1. Update AuthContext with new roles
2. Update API services with new endpoints
3. Enhance base components for role-based rendering

### Phase 2: Project Team Management
1. Create ProjectTeams view
2. Implement team assignment functionality
3. Add team lead designation within projects

### Phase 3: Customer Integration
1. Create CustomerTeams management
2. Implement Customer Teams Head workflow
3. Add Customer Team Member restricted views

### Phase 4: Task Assignment Workflow
1. Update TrackEntryForm with role-based assignment logic
2. Modify TrackEntries list with appropriate filters
3. Update TrackEntryDashboard with role-specific metrics

### Phase 5: UI Refinement
1. Improve navigation and access controls
2. Add visual workflow indicators
3. Implement comprehensive testing

## TODO List

### Completed
- [x] Fix SQL syntax error in customer_track_entries.sql
- [x] Update AuthContext with new role definitions
- [x] Implement ProjectTeams management page
- [x] Implement CustomerTeams management page
- [x] Update ProtectedRoute for new roles

### Current Priorities
1. Finalize role-based task assignment workflow
2. Implement team lead assignment functionality
3. Test all role-based access controls
4. Update documentation for new features

### Future Work
- Add bulk task assignment functionality
- Implement task dependency tracking
- Enhance reporting for team performance metrics 