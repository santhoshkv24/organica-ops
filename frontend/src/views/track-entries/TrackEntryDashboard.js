import React, { useState, useEffect } from "react";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CSpinner,
  CBadge,
  CProgress,
  CTooltip,
  CAlert,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilArrowRight,
  cilTask,
  cilCheckCircle,
  cilWarning,
  cilBan,
  cilOptions,
} from "@coreui/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { 
  getTrackEntryDashboard, 
  getTrackEntryStatistics,
  updateTrackEntryStatus,
  logHoursWorked,
  getTrackEntriesByAssignedBy,
  getCustomerTrackEntriesByAssignedBy,
  updateCustomerTrackEntryStatus,
  getCustomerTrackEntryDashboard,
  getCustomerCompanyTasks,
  getTrackEntries,
  getProjectsByManager,
  getTeamLeadStatus,
  getProjectManagerTasks,
  getTeamLeadTasks,
  getTrackEntry,
  getCustomerTrackEntry
} from '../../services/api';
import Button from '@mui/material/Button';
import TrackEntryDetailsModal from './TrackEntryDetailsModal';

// Material UI DataGrid imports
import { DataGrid } from '@mui/x-data-grid';
import { Box, Chip, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const TrackEntryDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [myTasks, setMyTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]); // Tasks for team members (Team Lead view)
  const [projectTasks, setProjectTasks] = useState([]); // Tasks for project members (Project Manager view)
  const [companyTasks, setCompanyTasks] = useState([]); // Tasks for company (Customer Team Head view)
  const [selectedEntry, setSelectedEntry] = useState(null); // Currently selected track entry for details view
  const [detailsModalVisible, setDetailsModalVisible] = useState(false); // Controls details modal visibility
  const [stats, setStats] = useState({
    total_tasks: 0,
    todo_count: 0,
    in_progress_count: 0,
    blocked_count: 0,
    done_count: 0,
    total_hours_estimated: 0,
    total_hours_worked: 0,
  });
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("myTasks");
  const [managedProjects, setManagedProjects] = useState([]);
  const [managedTeams, setManagedTeams] = useState([]);
  // Menu state for DataGrid actions
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  // Role-based permissions
  const isAdmin = user?.role === "admin";
  const isProjectManager = user?.role === "manager";
  const isTeamLead = user?.role === "team_lead";
  const isCustomer = user?.role?.startsWith("customer");
  const isCustomerTeamHead = user?.role === "customer_head";
  const isRegularEmployee =
    user?.role === "employee" || user?.role === "customer_employee";
  const canCreate =
    isAdmin || isProjectManager || isTeamLead || isCustomerTeamHead;
  // Only show My Tasks tab if user is NOT a project manager
  const shouldShowMyTasksTab = !isProjectManager;

  // Log user information for debugging
  useEffect(() => {
    console.log("Current user:", user);
    console.log("User ID:", user?.user_id);
    console.log("User role:", user?.role);
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      // Use try-catch for each API call to handle potential failures gracefully
      let myTasksData = [];
      let assignedTasksData = [];
      let teamTasksData = [];
      let projectTasksData = [];
      let companyTasksData = []; // For customer team heads
      let statsData = {
        total_tasks: 0,
        todo_count: 0,
        in_progress_count: 0,
        blocked_count: 0,
        done_count: 0,
        total_hours_spent: 0,
      };

      // 1. Fetch tasks assigned TO the current user (My Tasks tab)
      try {
        if (isCustomer) {
          // For customer users, use the customer dashboard endpoint
          const dashboardRes = await getCustomerTrackEntryDashboard();
          console.log("Customer Dashboard API response:", dashboardRes);
          if (dashboardRes && dashboardRes.success) {
            myTasksData = Array.isArray(dashboardRes.data)
              ? dashboardRes.data
              : [];
            console.log("My customer tasks data:", myTasksData);
            // Calculate statistics from the fetched tasks for customer users
            if (myTasksData.length > 0) {
              statsData.total_tasks = myTasksData.length;
              statsData.todo_count = myTasksData.filter(
                (task) => task.status === "To Do"
              ).length;
              statsData.in_progress_count = myTasksData.filter(
                (task) => task.status === "In Progress"
              ).length;
              statsData.blocked_count = myTasksData.filter(
                (task) => task.status === "Blocked"
              ).length;
              statsData.done_count = myTasksData.filter(
                (task) => task.status === "Done"
              ).length;
            }
          }
        } else {
          // For internal employees, use the regular dashboard endpoint
          const dashboardRes = await getTrackEntryDashboard();
          console.log("Dashboard API response:", dashboardRes);
          if (dashboardRes && dashboardRes.success) {
            myTasksData = Array.isArray(dashboardRes.data)
              ? dashboardRes.data
              : [];
            console.log("My tasks data:", myTasksData);
          }
        }
      } catch (error) {
        console.error("Error fetching my tasks data:", error);
        setError((prevError) =>
          prevError
            ? `${prevError}. Failed to load my tasks.`
            : "Failed to load my tasks."
        );
      }

      // 2. Fetch tasks ASSIGNED BY the current user (Tasks I've Assigned tab)
      if (user && user.user_id) {
        try {
          // Pass the user_id as the assignedById parameter
          console.log("Fetching tasks assigned by user:", user.user_id);
          const assignedRes = isCustomer
            ? await getCustomerTrackEntriesByAssignedBy(user.user_id)
            : await getTrackEntriesByAssignedBy(user.user_id);
          console.log("Raw assignedRes:", JSON.stringify(assignedRes, null, 2));
          if (assignedRes && assignedRes.success) {
            // Handle different response formats:
            // 1. If data is an array, use it directly
            // 2. If data is a single object, wrap it in an array
            // 3. Default to empty array
            if (Array.isArray(assignedRes.data)) {
              assignedTasksData = assignedRes.data;
            } else if (
              assignedRes.data &&
              typeof assignedRes.data === "object" &&
              assignedRes.data.track_entry_id
            ) {
              // Data is a single task object, convert to array with one element
              assignedTasksData = [assignedRes.data];
              console.log("Converted single task to array:", assignedTasksData);
            } else {
              assignedTasksData = [];
              console.log("No valid tasks found in response");
            }
            console.log(
              "Tasks I've assigned (processed):",
              assignedTasksData.length,
              "items"
            );
            // Log the first item to verify the data structure
            if (assignedTasksData.length > 0) {
              console.log("First task example:", assignedTasksData[0]);
            }
          }
        } catch (assignError) {
          console.error("Error fetching assigned tasks:", assignError);
          setError((prevError) =>
            prevError
              ? `${prevError}. Failed to load assigned tasks.`
              : "Failed to load assigned tasks."
          );
        }
      }

      // 3. For Customer Team Heads: Get all tasks for their company
      if (isCustomerTeamHead) {
        try {
          console.log("Fetching company tasks for customer team head");
          const companyTasksRes = await getCustomerCompanyTasks();
          if (companyTasksRes && companyTasksRes.success) {
            companyTasksData = Array.isArray(companyTasksRes.data)
              ? companyTasksRes.data
              : [];
            console.log(
              "Customer team head company tasks:",
              companyTasksData.length,
              "tasks found"
            );
          }
        } catch (error) {
          console.error("Error fetching customer company tasks:", error);
          setError((prevError) =>
            prevError
              ? `${prevError}. Failed to load company tasks.`
              : "Failed to load company tasks."
          );
        }
      }

      // 4. For Project Managers: Get all tasks in projects they manage
      if (isProjectManager) {
        try {
          // Use the dedicated project manager tasks endpoint
          console.log(
            "Fetching all tasks for projects managed by:",
            user.employee_id
          );
          const projectTasksRes = await getProjectManagerTasks(
            user.employee_id
          );
          if (projectTasksRes && projectTasksRes.success) {
            // Process the tasks directly
            projectTasksData = Array.isArray(projectTasksRes.data)
              ? projectTasksRes.data
              : [];
            console.log(
              "Project Manager's project tasks:",
              projectTasksData.length,
              "tasks found"
            );
          }
          // Also fetch the projects for reference
          const projectsRes = await getProjectsByManager(user.employee_id);
          if (projectsRes && projectsRes.data) {
            const projects = Array.isArray(projectsRes.data)
              ? projectsRes.data
              : [];
            setManagedProjects(projects);
            console.log(
              "Project Manager's projects:",
              projects.length,
              "projects found"
            );
          }
        } catch (error) {
          console.error("Error fetching project manager tasks:", error);
          setError((prevError) =>
            prevError
              ? `${prevError}. Failed to load project tasks.`
              : "Failed to load project tasks."
          );
        }
      }

      // 5. For Team Leads: Get all tasks assigned to team members in teams they lead
      if (isTeamLead) {
        try {
          // First get all teams led by this user
          const teamsRes = await getTeamLeadStatus(user.employee_id);
          if (teamsRes && teamsRes.data && teamsRes.data.teams) {
            const teams = teamsRes.data.teams;
            setManagedTeams(teams);
            // Use the dedicated team lead tasks endpoint
            console.log(
              "Fetching all tasks for teams led by:",
              user.employee_id
            );
            const teamTasksRes = await getTeamLeadTasks(user.employee_id);
            if (teamTasksRes && teamTasksRes.success) {
              teamTasksData = Array.isArray(teamTasksRes.data)
                ? teamTasksRes.data
                : [];
              console.log(
                "Team Lead's team tasks:",
                teamTasksData.length,
                "tasks found"
              );
            }
          }
        } catch (error) {
          console.error("Error fetching team lead tasks:", error);
          setError((prevError) =>
            prevError
              ? `${prevError}. Failed to load team tasks.`
              : "Failed to load team tasks."
          );
        }
      }

      // 6. Only fetch statistics for non-customer users
      if (!isCustomer) {
        try {
          const statsRes = await getTrackEntryStatistics();
          if (statsRes && statsRes.success && statsRes.data) {
            statsData = statsRes.data;
          }
        } catch (error) {
          console.error("Error fetching statistics data:", error);
          setError((prevError) =>
            prevError
              ? `${prevError}. Failed to load statistics.`
              : "Failed to load statistics."
          );
        }
      }

      // Set all data to state
      setMyTasks(myTasksData);
      setAssignedTasks(assignedTasksData);
      setTeamTasks(teamTasksData);
      setProjectTasks(projectTasksData);
      setCompanyTasks(companyTasksData);
      setStats(statsData);

      // Choose the most appropriate default tab based on user role
      if (isProjectManager) {
        // For Project Managers: prioritize project tasks, then assigned tasks
        setActiveTab(
          projectTasksData.length > 0 ? "projectTasks" : "assignedTasks"
        );
      } else if (isTeamLead) {
        // For Team Leads: prioritize team tasks, then my tasks
        setActiveTab(teamTasksData.length > 0 ? "teamTasks" : "myTasks");
      } else if (isCustomerTeamHead) {
        // For Customer Team Heads: prioritize company tasks, then assigned tasks, then my tasks
        if (companyTasksData.length > 0) {
          setActiveTab("companyTasks");
        } else if (assignedTasksData.length > 0) {
          setActiveTab("assignedTasks");
        } else {
          setActiveTab("myTasks");
        }
      } else {
        // For everyone else: default to my tasks
        setActiveTab("myTasks");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusChange = async (taskId, newStatus, isCustomerTask) => {
    try {
      setActionLoading(true);
      if (isCustomerTask) {
        await updateCustomerTrackEntryStatus(taskId, newStatus);
      } else {
        await updateTrackEntryStatus(taskId, newStatus);
      }
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error("Error updating status:", error);
      setError("Failed to update task status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = async (taskId, isCustomerTask) => {
    try {
      setActionLoading(true);
      let task;
      if (isCustomerTask) {
        const response = await getCustomerTrackEntry(taskId);
        task = response.data;
      } else {
        const response = await getTrackEntry(taskId);
        task = response.data;
      }
      if (task) {
        setSelectedEntry(task);
        setDetailsModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
      setError('Failed to load task details');
    } finally {
      setActionLoading(false);
    }
  };

  // Menu handlers for DataGrid actions
  const handleMenuOpen = (event, task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "To Do":
        return "default";
      case "In Progress":
        return "primary";
      case "Blocked":
        return "error";
      case "Done":
        return "success";
      default:
        return "default";
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case "Low":
        return "info";
      case "Medium":
        return "warning";
      case "High":
        return "error";
      case "Critical":
        return "error";
      default:
        return "default";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const calculateCompletionPercentage = () => {
    if (stats.total_tasks === 0) return 0;
    return Math.round((stats.done_count / stats.total_tasks) * 100);
  };

  const calculateHoursPercentage = () => {
    if (stats.total_hours_estimated === 0) return 0;
    return Math.min(
      100,
      Math.round((stats.total_hours_worked / stats.total_hours_estimated) * 100)
    );
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <CSpinner />
        <div className="mt-2">Loading dashboard...</div>
      </div>
    );
  }

  function formatHoursToDays(totalHours) {
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    let result = "";
    if (days > 0) {
      result += `${days} day${days !== 1 ? "s" : ""} `;
    }
    if (hours > 0) {
      result += `${hours} hr${hours !== 1 ? "s" : ""}`;
    }
    return result.trim() || "0 hrs";
  }

  // Create column definitions for DataGrid
  const createTaskColumns = (isMyTasksTab = false) => [
    {
      field: 'title',
      headerName: 'Title',
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Box>
          <div style={{ fontWeight: 'bold' }}>{params.row.title}</div>
          <div style={{ fontSize: '0.8em', color: '#666' }}>
            {params.row.description?.substring(0, 50)}
            {params.row.description?.length > 50 ? "..." : ""}
          </div>
        </Box>
      ),
    },
    {
      field: 'project_name',
      headerName: 'Project',
      flex: 1.5,
      minWidth: 150,
      renderCell: (params) => (
        <Box>
          <div>{params.row.project_name}</div>
          <div style={{ fontSize: '0.8em', color: '#666' }}>
            {params.row.team_name || params.row.customer_company_name}
          </div>
        </Box>
      ),
    },
    {
      field: 'assigned_by_name',
      headerName: 'Assigned By',
      flex: 1,
      minWidth: 120,
    },
    ...(isMyTasksTab ? [] : [{
      field: 'assigned_to_name',
      headerName: 'Assigned To',
      flex: 1,
      minWidth: 120,
      valueGetter: (params) => {
        // Safely get the value with fallback to empty string
        return 'Unassigned';
      },
    }]),
      {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusBadgeColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getPriorityBadgeColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'due_date',
      headerName: 'Due Date',
      flex: 1,
      minWidth: 120,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.5,
      minWidth: 80,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <IconButton
          onClick={(event) => handleMenuOpen(event, params.row)}
          size="small"
          disabled={actionLoading}
        >
          <MoreVertIcon />
        </IconButton>
      ),
    },
  ];

  // Prepare data for DataGrid (add unique id field)
  const prepareDataForGrid = (tasks) => {
    return tasks.map((task) => ({
      ...task,
      id: task.track_entry_id || task.customer_track_entry_id,
    }));
  };

  // Render DataGrid with empty state handling
  const renderTasksDataGrid = (tasks, emptyMessage, isMyTasksTab = false) => {
    if (!tasks || tasks.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {emptyMessage}
          </Typography>
          {canCreate && (
            <Button
              variant="contained"
              sx={{ mt: 2, backgroundColor: 'black', color: 'white', textTransform: 'none' }}
              onClick={() => navigate("/track-entries/create")}
            >
              Create New Task
            </Button>
          )}
        </Box>
      );
    }

    return (
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={prepareDataForGrid(tasks)}
          columns={createTaskColumns(isMyTasksTab)}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          rowHeight={70}
          checkboxSelection={false}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '1px solid #e0e0e0',
            }
          }}
        />
      </Box>
    );
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <CIcon icon={cilTask} className="me-2" />
          Task Dashboard
        </h2>
        <div>
          {canCreate && (
            <Button
              variant="contained"
              sx={{ backgroundColor: 'black', color: 'white', textTransform: 'none' }}
              onClick={() => navigate("/track-entries/create")}
            >
              Create Task
            </Button>
          )}
        </div>
      </div>
      
      {error && (
        <CAlert color="danger" dismissible onClose={() => setError("")}>
          {error}
        </CAlert>
      )}

      <CRow className="justify-content-center align-items-center">
        <CCol md={2}>
          <CCard className="mb-4 text-center">
            <CCardBody>
              <div className="h1 mb-3">{stats.total_tasks}</div>
              <div className="text-medium-emphasis">Total Tasks</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={2}>
          <CCard className="mb-4 text-center">
            <CCardBody>
              <div className="h1 mb-3 text-primary">
                {stats.in_progress_count}
              </div>
              <div className="text-medium-emphasis">In Progress</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={2}>
          <CCard className="mb-4 text-center">
            <CCardBody>
              <div className="h1 mb-3 text-danger">{stats.blocked_count}</div>
              <div className="text-medium-emphasis">Blocked</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={2}>
          <CCard className="mb-4 text-center">
            <CCardBody>
              <div className="h1 mb-3 text-success">{stats.done_count}</div>
              <div className="text-medium-emphasis">Completed</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={2}>
          <CCard className="mb-4 text-center">
            <CCardBody>
              <div className="h4 mb-3">
                {formatHoursToDays(stats.total_hours_spent)}
              </div>
              <div>Spent</div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="justify-content-center align-items-center">
        <CCol className="col-sm-8">
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Task Completion</strong>
            </CCardHeader>
            <CCardBody>
              <div className="d-flex justify-content-between mb-2">
                <div>Progress</div>
                <div>{calculateCompletionPercentage()}%</div>
              </div>
              <CProgress
                value={calculateCompletionPercentage()}
                className="mb-3"
              />
              <div className="d-flex justify-content-between small text-medium-emphasis">
                <div>
                  <span className="me-1">To Do:</span>
                  <span>{stats.todo_count}</span>
                </div>
                <div>
                  <span className="me-1">In Progress:</span>
                  <span>{stats.in_progress_count}</span>
                </div>
                <div>
                  <span className="me-1">Blocked:</span>
                  <span>{stats.blocked_count}</span>
                </div>
                <div>
                  <span className="me-1">Done:</span>
                  <span>{stats.done_count}</span>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CCard>
        <CCardHeader>
          <CNav variant="tabs" role="tablist">
            {shouldShowMyTasksTab && (
              <CNavItem>
                <CNavLink
                  active={activeTab === "myTasks"}
                  onClick={() => setActiveTab("myTasks")}
                  style={{ cursor: "pointer" }}
                >
                  My Tasks
                </CNavLink>
              </CNavItem>
            )}
            {(isAdmin ||
              isProjectManager ||
              isTeamLead ||
              isCustomerTeamHead) && (
              <CNavItem>
                <CNavLink
                  active={activeTab === "assignedTasks"}
                  onClick={() => setActiveTab("assignedTasks")}
                  style={{ cursor: "pointer" }}
                >
                  Tasks I've Assigned
                </CNavLink>
              </CNavItem>
            )}
            {isCustomerTeamHead && (
              <CNavItem>
                <CNavLink
                  active={activeTab === "companyTasks"}
                  onClick={() => setActiveTab("companyTasks")}
                  style={{ cursor: "pointer" }}
                >
                  Company Tasks
                </CNavLink>
              </CNavItem>
            )}
            {isTeamLead && (
              <CNavItem>
                <CNavLink
                  active={activeTab === "teamTasks"}
                  onClick={() => setActiveTab("teamTasks")}
                  style={{ cursor: "pointer" }}
                >
                  Team Tasks
                </CNavLink>
              </CNavItem>
            )}
            {isProjectManager && (
              <CNavItem>
                <CNavLink
                  active={activeTab === "projectTasks"}
                  onClick={() => setActiveTab("projectTasks")}
                  style={{ cursor: "pointer" }}
                >
                  Project Tasks
                </CNavLink>
              </CNavItem>
            )}
          </CNav>
        </CCardHeader>
        <CCardBody>
          <CTabContent>
            <CTabPane role="tabpanel" visible={activeTab === "myTasks"}>
              {renderTasksDataGrid(myTasks, "No tasks assigned to you.", true)}
            </CTabPane>
            <CTabPane role="tabpanel" visible={activeTab === "assignedTasks"}>
              {renderTasksDataGrid(assignedTasks, "You haven't assigned any tasks yet.", false)}
            </CTabPane>
            <CTabPane role="tabpanel" visible={activeTab === "companyTasks"}>
              {renderTasksDataGrid(companyTasks, "No tasks found for your company employees.", false)}
            </CTabPane>
            <CTabPane role="tabpanel" visible={activeTab === "teamTasks"}>
              {renderTasksDataGrid(teamTasks, "No tasks found for your team members.", false)}
            </CTabPane>
            <CTabPane role="tabpanel" visible={activeTab === "projectTasks"}>
              {renderTasksDataGrid(projectTasks, "No tasks found for your project members.", false)}
            </CTabPane>
          </CTabContent>
        </CCardBody>
      </CCard>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          style: {
            maxHeight: 48 * 4.5,
            width: '20ch',
          },
        }}
      >
        <MenuItem onClick={() => {
          const taskId = selectedTask?.track_entry_id || selectedTask?.customer_track_entry_id;
          const isCustomerTask = !!selectedTask?.customer_track_entry_id;
          handleViewDetails(taskId, isCustomerTask);
          handleMenuClose();
        }}>
          View Details
        </MenuItem>
        {selectedTask?.status !== "In Progress" && (
          <MenuItem onClick={() => {
            const taskId = selectedTask?.track_entry_id || selectedTask?.customer_track_entry_id;
            const isCustomerTask = !!selectedTask?.customer_track_entry_id;
            handleQuickStatusChange(taskId, "In Progress", isCustomerTask);
            handleMenuClose();
          }}>
            Mark In Progress
          </MenuItem>
        )}
        {selectedTask?.status !== "Done" && (
          <MenuItem onClick={() => {
            const taskId = selectedTask?.track_entry_id || selectedTask?.customer_track_entry_id;
            const isCustomerTask = !!selectedTask?.customer_track_entry_id;
            handleQuickStatusChange(taskId, "Done", isCustomerTask);
            handleMenuClose();
          }}>
            Mark Done
          </MenuItem>
        )}
        {selectedTask?.status !== "Blocked" && (
          <MenuItem onClick={() => {
            const taskId = selectedTask?.track_entry_id || selectedTask?.customer_track_entry_id;
            const isCustomerTask = !!selectedTask?.customer_track_entry_id;
            handleQuickStatusChange(taskId, "Blocked", isCustomerTask);
            handleMenuClose();
          }}>
            Mark Blocked
          </MenuItem>
        )}
      </Menu>

      {/* Track Entry Details Modal */}
      <TrackEntryDetailsModal
        visible={detailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        entry={selectedEntry}
      />
    </>
  );
};

export default TrackEntryDashboard;