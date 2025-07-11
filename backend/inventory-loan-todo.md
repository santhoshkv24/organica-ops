# Inventory Loan Management Feature: Implementation To-Do List

## A. Database Layer (Stored Procedures)
- [x] **SP: Create Inventory Loan**
  - Insert into `inventory_loans` and `inventory_loan_items`.
- [x] **SP: Approve/Reject Loan**
  - Update status, set `approved_by_user_id`, `approval_date`.
- [x] **SP: Assign & Issue Items**
  - Update `issued_by_user_id`, `issued_date`, and `quantity_issued` in items.
- [x] **SP: Update Returns**
  - Update `quantity_returned` in `inventory_loan_items`, set status to “Partially Returned” or “Returned” as needed.
- [x] **SP: Get Loans by Project/User/Team**
  - Fetch loans for dashboards and workflow steps.

## B. Backend (Controllers & Routes)
- [x] **Controller: inventoryLoanController.js**
  - Methods for create, approve/reject, assign/issue, update returns, get by user/project/team.
- [x] **Routes: inventoryLoanRoutes.js**
  - RESTful endpoints for all workflow steps.
- [x] **Middleware**
  - Ensure proper role-based access (employee, team lead, issuer).

## C. Frontend
- [ ] **Request Inventory Page**
  - Form for project, team, expected return date, and dynamic item list.
- [ ] **Approval Dashboard (Team Lead)**
  - List of pending requests, approve/reject actions.
- [ ] **Assign & Issue UI**
  - Select issuer, adjust quantities, confirm issue.
- [ ] **Return Management UI**
  - Update returned quantities, show status (partially/fully returned).
- [ ] **Status Tracking**
  - Show current status and history for each loan.

---

### Reusable Endpoints/SPs
- `GET /api/projects/user/:userId` (uses `sp_GetProjectsByUser`)
- `GET /api/teams/`
- `GET /api/employees/`
- `GET /api/users/:id`
- getTeamMembers for the team lead to assign the issuer 

---

**Start with SPs for inventory loan creation and workflow, then build backend, then frontend.**
