import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Chip,
  LinearProgress,
  Alert,
  Menu,
  MenuItem,
  IconButton,
  Tabs,
  Tab,
  Grid,
  Paper,
  Backdrop,
  Container,
  useTheme,
  alpha,
  Tooltip,
} from "@mui/material";
import {
  Task as TaskIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Block as BlockIcon,
  Warning as WarningIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
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
  getCustomerTrackEntry,
} from "../../services/api";
import TrackEntryDetailsModal from './TrackEntryDetailsModal';
import TaskTransferModal from './TaskTransferModal'; // Import the new modal

// Custom TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Custom styled components for better aesthetics
const StatsCard = ({ title, value, icon, color = "primary", subtitle }) => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)} 0%, ${alpha(theme.palette[color].main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
        borderRadius: 3,
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardContent sx={{ textAlign: "center", p: 4,}}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          {React.cloneElement(icon, {
            sx: {
              fontSize: 30,
              color: theme.palette[color].main,
            },
          })}
        </Box>
        <Typography variant="h3" sx={{ fontWeight: "bold", mb: 1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const TrackEntryDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [myTasks, setMyTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);
  const [projectTasks, setProjectTasks] = useState([]);
  const [companyTasks, setCompanyTasks] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
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
  const [activeTab, setActiveTab] = useState(0);
  const [managedProjects, setManagedProjects] = useState([]);
  const [managedTeams, setManagedTeams] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [taskToTransfer, setTaskToTransfer] = useState(null);

  // Role-based permissions
  const isAdmin = user?.role === "admin";
  const isProjectManager = user?.role === "manager";
  const isTeamLead = user?.role === "team_lead";
  const isCustomer = user?.role?.startsWith("customer");
  const isCustomerTeamHead = user?.role === "customer_head";
  const isRegularEmployee = user?.role === "employee" || user?.role === "customer_employee";
  const canCreate = isAdmin || isProjectManager || isTeamLead || isCustomerTeamHead;
  const shouldShowMyTasksTab = !isProjectManager;

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
      let myTasksData = [];
      let assignedTasksData = [];
      let teamTasksData = [];
      let projectTasksData = [];
      let companyTasksData = [];
      let statsData = {
        total_tasks: 0,
        todo_count: 0,
        in_progress_count: 0,
        blocked_count: 0,
        done_count: 0,
        total_hours_spent: 0,
      };

      // Fetch tasks assigned TO the current user
      try {
        if (isCustomer) {
          const dashboardRes = await getCustomerTrackEntryDashboard();
          console.log("Customer Dashboard API response:", dashboardRes);
          if (dashboardRes && dashboardRes.success) {
            myTasksData = Array.isArray(dashboardRes.data) ? dashboardRes.data : [];
            console.log("My customer tasks data:", myTasksData);
            if (myTasksData.length > 0) {
              statsData.total_tasks = myTasksData.length;
              statsData.todo_count = myTasksData.filter(task => task.status === "To Do").length;
              statsData.in_progress_count = myTasksData.filter(task => task.status === "In Progress").length;
              statsData.blocked_count = myTasksData.filter(task => task.status === "Blocked").length;
              statsData.done_count = myTasksData.filter(task => task.status === "Done").length;
            }
          }
        } else {
          const dashboardRes = await getTrackEntryDashboard();
          console.log("Dashboard API response:", dashboardRes);
          if (dashboardRes && dashboardRes.success) {
            myTasksData = Array.isArray(dashboardRes.data) ? dashboardRes.data : [];
            console.log("My tasks data:", myTasksData);
          }
        }
      } catch (error) {
        console.error("Error fetching my tasks data:", error);
        setError(prevError => prevError ? `${prevError}. Failed to load my tasks.` : "Failed to load my tasks.");
      }

      // Fetch tasks ASSIGNED BY the current user
      if (user && user.user_id) {
        try {
          console.log("Fetching tasks assigned by user:", user.user_id);
          const assignedRes = isCustomer
            ? await getCustomerTrackEntriesByAssignedBy(user.user_id)
            : await getTrackEntriesByAssignedBy(user.user_id);
          console.log("Raw assignedRes:", JSON.stringify(assignedRes, null, 2));
          if (assignedRes && assignedRes.success) {
            if (Array.isArray(assignedRes.data)) {
              assignedTasksData = assignedRes.data;
            } else if (assignedRes.data && typeof assignedRes.data === "object" && assignedRes.data.track_entry_id) {
              assignedTasksData = [assignedRes.data];
              console.log("Converted single task to array:", assignedTasksData);
            } else {
              assignedTasksData = [];
              console.log("No valid tasks found in response");
            }
            console.log("Tasks I've assigned (processed):", assignedTasksData.length, "items");
            if (assignedTasksData.length > 0) {
              console.log("First task example:", assignedTasksData[0]);
            }
          }
        } catch (assignError) {
          console.error("Error fetching assigned tasks:", assignError);
          setError(prevError => prevError ? `${prevError}. Failed to load assigned tasks.` : "Failed to load assigned tasks.");
        }
      }

      // For Customer Team Heads: Get all tasks for their company
      if (isCustomerTeamHead) {
        try {
          console.log("Fetching company tasks for customer team head");
          const companyTasksRes = await getCustomerCompanyTasks();
          if (companyTasksRes && companyTasksRes.success) {
            companyTasksData = Array.isArray(companyTasksRes.data) ? companyTasksRes.data : [];
            console.log("Customer team head company tasks:", companyTasksData.length, "tasks found");
          }
        } catch (error) {
          console.error("Error fetching customer company tasks:", error);
          setError(prevError => prevError ? `${prevError}. Failed to load company tasks.` : "Failed to load company tasks.");
        }
      }

      // For Project Managers: Get all tasks in projects they manage
      if (isProjectManager) {
        try {
          console.log("Fetching all tasks for projects managed by:", user.employee_id);
          const projectTasksRes = await getProjectManagerTasks(user.employee_id);
          if (projectTasksRes && projectTasksRes.success) {
            projectTasksData = Array.isArray(projectTasksRes.data) ? projectTasksRes.data : [];
            console.log("Project Manager's project tasks:", projectTasksData.length, "tasks found");
          }
          const projectsRes = await getProjectsByManager(user.employee_id);
          if (projectsRes && projectsRes.data) {
            const projects = Array.isArray(projectsRes.data) ? projectsRes.data : [];
            setManagedProjects(projects);
            console.log("Project Manager's projects:", projects.length, "projects found");
          }
        } catch (error) {
          console.error("Error fetching project manager tasks:", error);
          setError(prevError => prevError ? `${prevError}. Failed to load project tasks.` : "Failed to load project tasks.");
        }
      }

      // For Team Leads: Get all tasks assigned to team members
      if (isTeamLead) {
        try {
          const teamsRes = await getTeamLeadStatus(user.employee_id);
          if (teamsRes && teamsRes.data && teamsRes.data.teams) {
            const teams = teamsRes.data.teams;
            setManagedTeams(teams);
            console.log("Fetching all tasks for teams led by:", user.employee_id);
            const teamTasksRes = await getTeamLeadTasks(user.employee_id);
            if (teamTasksRes && teamTasksRes.success) {
              teamTasksData = Array.isArray(teamTasksRes.data) ? teamTasksRes.data : [];
              console.log("Team Lead's team tasks:", teamTasksData.length, "tasks found");
            }
          }
        } catch (error) {
          console.error("Error fetching team lead tasks:", error);
          setError(prevError => prevError ? `${prevError}. Failed to load team tasks.` : "Failed to load team tasks.");
        }
      }

      // Fetch statistics for non-customer users
      if (!isCustomer) {
        try {
          const statsRes = await getTrackEntryStatistics();
          if (statsRes && statsRes.success && statsRes.data) {
            statsData = statsRes.data;
          }
        } catch (error) {
          console.error("Error fetching statistics data:", error);
          setError(prevError => prevError ? `${prevError}. Failed to load statistics.` : "Failed to load statistics.");
        }
      }

      // Set all data to state
      setMyTasks(myTasksData);
      setAssignedTasks(assignedTasksData);
      setTeamTasks(teamTasksData);
      setProjectTasks(projectTasksData);
      setCompanyTasks(companyTasksData);
      setStats(statsData);

      // Set default tab based on user role
      if (isProjectManager) {
        setActiveTab(projectTasksData.length > 0 ? 1 : 0);
      } else if (isTeamLead) {
        setActiveTab(teamTasksData.length > 0 ? 2 : 0);
      } else if (isCustomerTeamHead) {
        if (companyTasksData.length > 0) {
          setActiveTab(2);
        } else if (assignedTasksData.length > 0) {
          setActiveTab(1);
        } else {
          setActiveTab(0);
        }
      } else {
        setActiveTab(0);
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
      fetchDashboardData();
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
      console.error("Error fetching task details:", error);
      setError("Failed to load task details");
    } finally {
      setActionLoading(false);
    }
  };

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
        return "info";
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
    if (isNaN(date.getTime())) return "";
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const pad = (num) => num.toString().padStart(2, "0");
    return `${pad(day)}-${pad(month)}-${year}`;
  };

  const calculateCompletionPercentage = () => {
    if (stats.total_tasks === 0) return 0;
    return Math.round((stats.done_count / stats.total_tasks) * 100);
  };

  const formatHoursToDays = (totalHours) => {
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    let result = "";
    if (days > 0) {
      result += `${days} day${days !== 1 ? "s" : ""} `;
    }
    if (hours > 0) {
      result += `${Math.floor(hours)} hr${hours !== 1 ? "s" : ""}`;
    }
    return result.trim() || "0 hrs";
  };

  const createTaskColumns = (isMyTasksTab = false) => [
    {
      field: "title",
      headerName: "Title",
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
            {params.row.title}
          </Typography>
        </Box>
      ),
    },
    {
      field: "project_name",
      headerName: "Project",
      flex: 1.5,
      minWidth: 150,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2">{params.row.project_name}   <Typography variant="caption" color="text.secondary">
            {params.row.team_name || params.row.customer_company_name}
          </Typography></Typography>

        </Box>
      ),
    },
    {
      field: "assigned_by_name",
      headerName: "Assigned By",
      flex: 1,
      minWidth: 120,
    },
    ...(isMyTasksTab
      ? []
      : [
        {
          field: "assigned_to_name",
          headerName: "Assigned To",
          flex: 1,
          minWidth: 120,
          valueGetter: (value, row) => row.employee_name || row.assigned_to_name,
        },
      ]),
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusBadgeColor(params.value)}
          size="small"
          sx={{ fontWeight: "medium" }}
        />
      ),
    },
    {
      field: "priority",
      headerName: "Priority",
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getPriorityBadgeColor(params.value)}
          size="small"
          sx={{ fontWeight: "medium" }}
        />
      ),
    },
    {
      field: "due_date",
      headerName: "Due Date",
      flex: 1,
      minWidth: 120,
      valueGetter: (params) => formatDate(params),
    },
    {
      field: "actions",
      headerName: "Actions",
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

  const prepareDataForGrid = (tasks) => {
    console.log(
      "Tasks with due_date:",
      tasks.map((task) => ({
        id: task.track_entry_id,
        due_date: task.due_date,
      }))
    );
    return tasks.map((task) => ({
      ...task,
      id: task.track_entry_id || task.customer_track_entry_id,
    }));
  };

  const renderTasksDataGrid = (tasks, emptyMessage, isMyTasksTab = false) => {
    if (!tasks || tasks.length === 0) {
      return (
        <Box sx={{ p: 6, textAlign: "center" }}>
          <TaskIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            {emptyMessage}
          </Typography>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/track-entries/create")}
              sx={{
                backgroundColor: "#000",
                color: "#fff",
                "&:hover": { backgroundColor: "#333" },
                textTransform: "none",
                px: 3,
                py: 1.5,
              }}
            >
              Create New Task
            </Button>
          )}
        </Box>
      );
    }
    return (
      <Box sx={{ width: '100%', minHeight: 400 }}>
        <DataGrid
          rows={prepareDataForGrid(tasks)}
          columns={createTaskColumns(isMyTasksTab)}
          autoHeight
          disableRowSelectionOnClick
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          rowHeight={60}
          sx={{
            '--DataGrid-containerBackground': theme.palette.background.paper,
            '--DataGrid-rowHeight': '60px',
            '--DataGrid-rowSpacing': '0px',
            '--DataGrid-cellPadding': '0 16px',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              borderBottom: `1px solid ${theme.palette.divider}`,
            },
            '& .MuiDataGrid-columnHeader': {
              padding: '0 16px',
              '&:focus, &:focus-within': {
                outline: 'none',
              },
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
            '& .MuiDataGrid-cell': {
              borderRight: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              '& > *': {
                width: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
            },
            '& .MuiDataGrid-row': {
              '&:nth-of-type(odd)': {
                backgroundColor: theme.palette.action.hover,
              },
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              },
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: `1px solid ${theme.palette.divider}`,
              '& .MuiTablePagination-root': {
                marginLeft: 'auto',
              },
            },
            '& .MuiDataGrid-virtualScroller': {
              '&::-webkit-scrollbar': {
                height: '8px',
                width: '8px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.action.disabled,
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: theme.palette.background.default,
              },
            },
          }}
        />
      </Box>
    );
  };

  const getTabConfig = () => {
    const tabs = [];
    if (shouldShowMyTasksTab) {
      tabs.push({
        label: "My Tasks",
        icon: <PersonIcon />,
        content: renderTasksDataGrid(myTasks, "No tasks assigned to you.", true),
      });
    }
    if (isAdmin || isProjectManager || isTeamLead || isCustomerTeamHead) {
      tabs.push({
        label: "Tasks I've Assigned",
        icon: <AssignmentIcon />,
        content: renderTasksDataGrid(assignedTasks, "You haven't assigned any tasks yet.", false),
      });
    }
    if (isCustomerTeamHead) {
      tabs.push({
        label: "Company Tasks",
        icon: <BusinessIcon />,
        content: renderTasksDataGrid(companyTasks, "No tasks found for your company employees.", false),
      });
    }
    if (isTeamLead) {
      tabs.push({
        label: "Team Tasks",
        icon: <PeopleIcon />,
        content: renderTasksDataGrid(teamTasks, "No tasks found for your team members.", false),
      });
    }
    if (isProjectManager) {
      tabs.push({
        label: "Project Tasks",
        icon: <TrendingUpIcon />,
        content: renderTasksDataGrid(projectTasks, "No tasks found for your project members.", false),
      });
    }
    return tabs;
  };

  const tabConfig = getTabConfig();

  if (loading) {
    return (
      <Backdrop open={loading} sx={{ zIndex: 1000 }}>
        <Box sx={{ textAlign: "center", color: "white" }}>
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading dashboard...
          </Typography>
        </Box>
      </Backdrop>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <TaskIcon sx={{ fontSize: 40, mr: 2, color: "primary.main" }} />
          <Typography variant="h4" sx={{ fontWeight: "bold", color: "text.primary" }}>
            Task Dashboard
          </Typography>
        </Box>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/track-entries/create")}
            sx={{
              backgroundColor: "#000",
              color: "#fff",
              "&:hover": { backgroundColor: "#333" },
              textTransform: "none",
              px: 3,
              py: 1.5,
              borderRadius: 2,
            }}
          >
            Create Task
          </Button>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{mb: 10}}>
        {/* First 4 Cards - Equal Width */}
        <Grid item xs={12} sm={6} md={2.4}>
          <StatsCard
            title="Total Tasks"
            value={stats.total_tasks}
            icon={<TaskIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatsCard
            title="In Progress"
            value={stats.in_progress_count}
            icon={<ScheduleIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatsCard
            title="Blocked"
            value={stats.blocked_count}
            icon={<BlockIcon />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatsCard
            title="Completed"
            value={stats.done_count}
            icon={<CheckCircleIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatsCard
            title="Time Spent"
            value={formatHoursToDays(stats.total_hours_spent)}
            icon={<AccessTimeIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Progress Card */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <TrendingUpIcon sx={{ mr: 2, color: "primary.main" }} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Task Completion Progress
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="body1" color="text.secondary">
              Overall Progress
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {calculateCompletionPercentage()}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={calculateCompletionPercentage()}
            sx={{
              height: 12,
              borderRadius: 6,
              mb: 3,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            }}
          />
          <Grid container spacing={3} justifyContent="flex-end">            <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                To Do
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "text.primary" }}>
                {stats.todo_count}
              </Typography>
            </Box>
          </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  In Progress
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "info.main" }}>
                  {stats.in_progress_count}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Blocked
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "error.main" }}>
                  {stats.blocked_count}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Done
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "success.main" }}>
                  {stats.done_count}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={{ borderRadius: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            aria-label="task dashboard tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabConfig.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                sx={{ textTransform: "none" }}
              />
            ))}
          </Tabs>
        </Box>
        {tabConfig.map((tab, index) => (
          <TabPanel key={index} value={activeTab} index={index}>
            {tab.content}
          </TabPanel>
        ))}
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          style: {
            maxHeight: 48 * 4.5,
            width: "20ch",
          },
        }}
      >
        <MenuItem
          onClick={() => {
            const taskId =
              selectedTask?.track_entry_id ||
              selectedTask?.customer_track_entry_id;
            const isCustomerTask = !!selectedTask?.customer_track_entry_id;
            handleViewDetails(taskId, isCustomerTask);
            handleMenuClose();
          }}
        >
          View Details
        </MenuItem>
        {(isProjectManager || isTeamLead) && (
            <MenuItem onClick={() => {
                setTaskToTransfer(selectedTask);
                setTransferModalVisible(true);
                handleMenuClose();
            }}>
                Transfer Task
            </MenuItem>
        )}
        {selectedTask?.status !== "In Progress" && (
          <MenuItem
            onClick={() => {
              const taskId =
                selectedTask?.track_entry_id ||
                selectedTask?.customer_track_entry_id;
              const isCustomerTask = !!selectedTask?.customer_track_entry_id;
              handleQuickStatusChange(taskId, "In Progress", isCustomerTask);
              handleMenuClose();
            }}
          >
            Mark In Progress
          </MenuItem>
        )}
        {selectedTask?.status !== "Done" && (
          <MenuItem
            onClick={() => {
              const taskId =
                selectedTask?.track_entry_id ||
                selectedTask?.customer_track_entry_id;
              const isCustomerTask = !!selectedTask?.customer_track_entry_id;
              handleQuickStatusChange(taskId, "Done", isCustomerTask);
              handleMenuClose();
            }}
          >
            Mark Done
          </MenuItem>
        )}
        {selectedTask?.status !== "Blocked" && (
          <MenuItem
            onClick={() => {
              const taskId =
                selectedTask?.track_entry_id ||
                selectedTask?.customer_track_entry_id;
              const isCustomerTask = !!selectedTask?.customer_track_entry_id;
              handleQuickStatusChange(taskId, "Blocked", isCustomerTask);
              handleMenuClose();
            }}
          >
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
      <TaskTransferModal
        open={transferModalVisible}
        onClose={() => setTransferModalVisible(false)}
        task={taskToTransfer}
        onTransferSuccess={() => {
          fetchDashboardData();
          setTransferModalVisible(false);
        }}
      />
    </Container>
  );
};

export default TrackEntryDashboard;