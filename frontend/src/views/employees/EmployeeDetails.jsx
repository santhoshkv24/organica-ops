import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CButton,
  CSpinner,
  CAlert,
  CBadge,
  CForm,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilArrowLeft,
  cilUser,
  cilBriefcase,
  cilBuilding,
  cilSearch,
  cilFilter,
  cilPlus,
  cilReload,
  cilOptions,
  cilFullscreen,
  cilFullscreenExit,
  cilCloudUpload,
} from "@coreui/icons";
import StaticGrid from "../../components/StaticGrid";
import {
  getEmployees,
  getTeams,
  getCompanies,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

import EmployeeImportModal from "./EmployeeImportModal";

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user && user.role === "admin";
  const gridRef = useRef(null);
  const cardRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilters, setSearchFilters] = useState({
    branch_id: "",
    team_id: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch employees, teams, and branches (previously companies)
      const [employeesResponse, teamsResponse, companiesResponse] =
        await Promise.all([getEmployees(), getTeams(), getCompanies()]);

      setEmployees(employeesResponse.data.data || employeesResponse.data);
      setTeams(teamsResponse.data.data || teamsResponse.data);
      setCompanies(companiesResponse.data.data || companiesResponse.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle field change to update dependencies
  const handleFieldChange = (rowId, field, value, isNewRow, row) => {
    if (field === "branch_id") {
      // When branch changes, reset team
      if (isNewRow) {
        // For new rows, we need to update the newRows state
        return {
          branch_id: value,
          team_id: "",
        };
      } else {
        // For existing rows, return the changes to apply
        return {
          branch_id: value,
          team_id: "",
        };
      }
    }

    // Default case, just update the field
    return { [field]: value };
  };

  // Handle search filters change
  const handleFilterChange = (field, value) => {
    setSearchFilters((prev) => ({
      ...prev,
      [field]: value,
    }));

    // If changing branch, reset team
    if (field === "branch_id") {
      setSearchFilters((prev) => ({
        ...prev,
        team_id: "",
      }));
    }
  };

  // Define columns for the StaticGrid
  const columns = [
    {
      key: "first_name",
      label: "First Name",
      type: "text",
      width: "120px",
      placeholder: "First Name",
    },
    {
      key: "last_name",
      label: "Last Name",
      type: "text",
      width: "120px",
      placeholder: "Last Name",
    },
    {
      key: "branch_id",
      label: "Branch",
      type: "select",
      width: "180px",
      options: companies.map((company) => ({
        value: company.branch_id || company.company_id,
        label: company.name,
      })),
      // For display purposes when not in edit mode
      render: (value, row) => {
        // First check if we have a direct branch_id
        if (value) {
          const branch = companies.find(
            (c) => (c.branch_id || c.company_id) == value
          );
          return branch.company_name;
        }

        // If we have branch_name or company_name, use that
        if (row.branch_name) {
          return row.branch_name;
        }
        if (row.company_name) {
          return row.company_name;
        }

        return "";
      },
    },
    {
      key: "team_id",
      label: "Team",
      type: "select",
      width: "180px",
      options: (row) => {
        const branchId = row.branch_id;
        if (!branchId) return [];

        return teams
          .filter((team) => team.branch_id == branchId)
          .map((team) => ({
            value: team.team_id,
            label: team.name,
          }));
      },
      // For display purposes when not in edit mode
      render: (value, row) => {
        if (!value && row.team_name) {
          // If we have team_name but no team_id
          return row.team_name;
        }
        const team = teams.find((t) => t.team_id == value);
        return team ? team.name : "";
      },
    },
    {
      key: "position",
      label: "Position",
      type: "text",
      width: "150px",
      placeholder: "Position",
    },
    {
      key: "email",
      label: "Email",
      type: "text",
      width: "180px",
      placeholder: "Email",
    },
    {
      key: "phone",
      label: "Phone",
      type: "text",
      width: "120px",
      placeholder: "Phone",
    },
    {
      key: "hire_date",
      label: "Hire Date",
      type: "date",
      width: "130px",
      render: (value) => {
        if (!value) return "";
        const date = new Date(value);
        if (isNaN(date.getTime())) return value; // Return original if invalid date

        // Format as dd/mm/yyyy
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
      },
    },
  ];

  // Define validation schema
  const validationSchema = {
    first_name: { required: true },
    last_name: { required: true },
    email: { required: true, type: "email" },
    position: { required: true },
  };

  // Handle save changes
  const handleSaveChanges = async (updates) => {
    try {
      // Handle new employees
      if (updates.new.length > 0) {
        for (const employee of updates.new) {
          // Prepare data for backend
          const employeeData = {
            first_name: employee.first_name,
            last_name: employee.last_name,
            email: employee.email,
            phone: employee.phone || "",
            position: employee.position || "",
            team_id: employee.team_id || null,
            hire_date: formatDateForBackend(employee.hire_date),
          };
          console.log(employeeData);

          await createEmployee(employeeData);
        }
      }

      // Handle updated employees
      if (updates.updated.length > 0) {
        for (const update of updates.updated) {
          // Extract ID and prepare data for backend
          const employeeId = update.id;

          // Find the original employee to get all fields
          const originalEmployee = employees.find(
            (emp) => emp.employee_id == employeeId
          );
          if (!originalEmployee) continue;

          // Merge the original employee data with updates
          const employeeData = {
            first_name:
              update.first_name !== undefined
                ? update.first_name
                : originalEmployee.first_name,
            last_name:
              update.last_name !== undefined
                ? update.last_name
                : originalEmployee.last_name,
            email:
              update.email !== undefined
                ? update.email
                : originalEmployee.email,
            phone:
              update.phone !== undefined
                ? update.phone || ""
                : originalEmployee.phone || "",
            position:
              update.position !== undefined
                ? update.position || ""
                : originalEmployee.position || "",
            team_id:
              update.team_id !== undefined
                ? update.team_id
                : originalEmployee.team_id,
            hire_date:
              update.hire_date !== undefined
                ? formatDateForBackend(update.hire_date)
                : formatDateForBackend(originalEmployee.hire_date),
          };

          await updateEmployee(employeeId, employeeData);
        }
      }

      // Refresh employee data
      await fetchData();

      return true;
    } catch (error) {
      console.error("Error saving employee changes:", error);
      throw new Error(error.message || "Failed to save changes");
    }
  };

  // Format date for backend (YYYY-MM-DD)
  const formatDateForBackend = (dateValue) => {
    if (!dateValue) return null;

    // If it's already a date string in YYYY-MM-DD format, return as is
    if (
      typeof dateValue === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ) {
      return dateValue;
    }

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return null;

      // Format as YYYY-MM-DD
      return date.toISOString().split("T")[0];
    } catch (error) {
      console.error("Error formatting date:", error);
      return null;
    }
  };

  // Handle delete employee
  const handleDeleteEmployee = async (employeeId) => {
    try {
      await deleteEmployee(employeeId);

      // Refresh employee data
      await fetchData();

      return true;
    } catch (error) {
      console.error("Error deleting employee:", error);
      throw new Error(error.message || "Failed to delete employee");
    }
  };

  // Filter employees if we're looking at a specific team
  let filteredEmployees = employees;
  let headerTitle = "All Employees";

  if (id) {
    // Check if id is for a team
    if (id.startsWith("team-")) {
      const teamId = parseInt(id.replace("team-", ""));
      filteredEmployees = employees.filter((emp) => emp.team_id === teamId);
      const team = teams.find((t) => t.team_id === teamId);
      headerTitle = `Employees in ${team?.name || "Team"}`;
    }
  }

  // Apply search filters
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    filteredEmployees = filteredEmployees.filter(
      (emp) =>
        emp.first_name?.toLowerCase().includes(searchLower) ||
        emp.last_name?.toLowerCase().includes(searchLower) ||
        emp.email?.toLowerCase().includes(searchLower) ||
        emp.position?.toLowerCase().includes(searchLower) ||
        emp.phone?.toLowerCase().includes(searchLower)
    );
  }

  // Apply dropdown filters
  if (searchFilters.branch_id) {
    filteredEmployees = filteredEmployees.filter((emp) => {
      // Direct branch_id match
      if (emp.branch_id == searchFilters.branch_id) return true;

      // Try to match via team's branch_id
      if (emp.team_id) {
        const team = teams.find((t) => t.team_id == emp.team_id);
        return team && team.branch_id == searchFilters.branch_id;
      }

      return false;
    });
  }

  if (searchFilters.team_id) {
    filteredEmployees = filteredEmployees.filter(
      (emp) => emp.team_id == searchFilters.team_id
    );
  }

  // Get available teams based on selected branch
  const availableTeams = searchFilters.branch_id
    ? teams.filter((team) => team.branch_id == searchFilters.branch_id)
    : teams;

  // Handle add new row
  const handleAddNew = () => {
    if (gridRef.current && typeof gridRef.current.handleAddRow === "function") {
      gridRef.current.handleAddRow();
    }
  };

  // Toggle fullscreen mode
  const toggleFullScreen = () => {
    if (!isFullScreen) {
      const element = cardRef.current;
      if (element && element.requestFullscreen) {
        element.requestFullscreen().then(() => {
          setIsFullScreen(true);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullScreen(false);
        });
      }
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSearchFilters({
      branch_id: "",
      team_id: "",
    });
  };

  return (
    <>
      {id && (
        <CButton
          color="primary"
          variant="outline"
          className="mb-3"
          onClick={() => navigate("/employees")}
        >
          <CIcon icon={cilArrowLeft} className="me-1" /> Back to All Employees
        </CButton>
      )}

      <CCard className="mb-4" ref={cardRef}>
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <strong>{headerTitle}</strong>
            <div className="d-flex gap-2 align-items-center">
              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </CInputGroup>

              <div className="d-flex">
                {isAdmin && (
                  <CButton
                    color="secondary"
                    variant="outline"
                    size="sm"
                    className="me-2"
                    onClick={() => setIsImportModalVisible(true)}
                    title="Import Employees"
                  >
                    <CIcon icon={cilCloudUpload} />
                  </CButton>
                )}
                <CDropdown>
                  <CDropdownToggle color="primary" variant="outline" size="sm">
                    <CIcon icon={cilOptions} />
                  </CDropdownToggle>
                  <CDropdownMenu>
                    <CDropdownItem onClick={clearFilters}>
                      Clear Search & Filters
                    </CDropdownItem>
                    <CDropdownItem onClick={() => setShowFilters(!showFilters)}>
                      {showFilters ? "Hide Filters" : "Show Filters"}
                    </CDropdownItem>
                    <CDropdownItem onClick={toggleFullScreen}>
                      <CIcon
                        icon={isFullScreen ? cilFullscreenExit : cilFullscreen}
                        className="me-2"
                      />
                      {isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
                    </CDropdownItem>
                    <CDropdownItem onClick={fetchData}>
                      <CIcon icon={cilReload} className="me-2" /> Refresh Data
                    </CDropdownItem>
                  </CDropdownMenu>
                </CDropdown>
              </div>
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          {error && (
            <CAlert color="danger" dismissible>
              {error}
            </CAlert>
          )}

          {/* Filters section */}
          {showFilters && (
            <div className="mb-4 p-3 border rounded bg-light">
              <CRow className="g-2">
                <CCol md={4}>
                  <label className="form-label">Branch</label>
                  <CFormSelect
                    value={searchFilters.branch_id}
                    onChange={(e) =>
                      handleFilterChange("branch_id", e.target.value)
                    }
                    options={[
                      { label: "All Branches", value: "" },
                      ...companies.map((company) => ({
                        value: company.branch_id || company.company_id,
                        label: company.name,
                      })),
                    ]}
                  />
                </CCol>

                <CCol md={4}>
                  <label className="form-label">Team</label>
                  <CFormSelect
                    value={searchFilters.team_id}
                    onChange={(e) =>
                      handleFilterChange("team_id", e.target.value)
                    }
                    options={[
                      { label: "All Teams", value: "" },
                      ...availableTeams.map((team) => ({
                        value: team.team_id,
                        label: team.name,
                      })),
                    ]}
                    disabled={!searchFilters.branch_id}
                  />
                </CCol>
              </CRow>
            </div>
          )}

          <StaticGrid
            ref={gridRef}
            title={false} // Hide the title since we have our own header
            data={filteredEmployees}
            columns={columns}
            loading={loading}
            onSave={isAdmin ? handleSaveChanges : undefined}
            onDelete={isAdmin ? handleDeleteEmployee : undefined}
            validationSchema={validationSchema}
            emptyMessage="No employees found"
            idField="employee_id"
            onFieldChange={handleFieldChange}
            newRowDefaults={{
              first_name: "",
              last_name: "",
              email: "",
              phone: "",
              position: "",
              hire_date: new Date().toISOString().split("T")[0],
            }}
          />
        </CCardBody>
      </CCard>
      {!isAdmin && (
        <EmployeeImportModal
          visible={isImportModalVisible}
          onClose={() => setIsImportModalVisible(false)}
          onImportSuccess={fetchData}
        />
      )}
    </>
  );
};

export default EmployeeDetails;
