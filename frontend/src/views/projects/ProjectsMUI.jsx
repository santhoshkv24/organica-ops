import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Avatar,
  Fade,
  Zoom,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  DateRange as DateIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getProjects, deleteProject } from "../../services/api";
import ProjectFormDialog from "./ProjectFormDialog";
import ProjectDeleteDialog from "./ProjectDeleteDialog";
import { format } from "date-fns";

const ProjectsMUI = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formMode, setFormMode] = useState("create"); // 'create', 'edit', 'view'

  // Menu state for actions
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuProject, setMenuProject] = useState(null);

  const isAdmin = user && (user.role === "admin" || user.role === "manager");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProjects();
      const projectsData = response.data?.data || response.data || [];
      setProjects(projectsData);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError("Failed to load projects. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    setSelectedProject(null);
    setFormMode("create");
    setFormDialogOpen(true);
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setFormMode("edit");
    setFormDialogOpen(true);
    handleCloseMenu();
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setFormMode("view");
    setFormDialogOpen(true);
    handleCloseMenu();
  };

  const handleDeleteProject = (project) => {
    setSelectedProject(project);
    setDeleteDialogOpen(true);
    handleCloseMenu();
  };

  const handleFormSubmit = async () => {
    setSuccess("Project saved successfully!");
    setTimeout(() => setSuccess(null), 3000);
    await fetchProjects();
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteProject(selectedProject.project_id);
      setSuccess("Project deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
      await fetchProjects();
    } catch (err) {
      setError(
        "Failed to delete project. It may have associated teams or data."
      );
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const handleOpenMenu = (event, project) => {
    setAnchorEl(event.currentTarget);
    setMenuProject(project);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuProject(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "planning":
        return "default";
      case "in_progress":
        return "primary";
      case "on_hold":
        return "warning";
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Filter projects based on search term and tab
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      !searchTerm ||
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.customer_company_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      project.manager_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());

    // Tab filtering by status
    switch (tabValue) {
      case 1: // Active Projects
        return (
          matchesSearch && ["planning", "in_progress"].includes(project.status)
        );
      case 2: // On Hold
        return matchesSearch && project.status === "on_hold";
      case 3: // Completed
        return matchesSearch && project.status === "completed";
      case 4: // Cancelled
        return matchesSearch && project.status === "cancelled";
      default: // All Projects
        return matchesSearch;
    }
  });

  const columns = [
    {
      field: "name",
      headerName: "Project",
      flex: 2,
      minWidth: 250,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 2 }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
            <WorkIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              {params.value}
            </Typography>
            <Chip
              label={formatStatus(params.row.status)}
              size="small"
              color={getStatusColor(params.row.status)}
              variant="outlined"
            />
          </Box>
        </Box>
      ),
    },
    {
      field: "customer_company_name",
      headerName: "Customer Company",
      flex: 1.5,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 2 }}>
          <BusinessIcon color="action" fontSize="small" />
          <Typography variant="body2">{params.value || "N/A"}</Typography>
        </Box>
      ),
    },
    {
      field: "manager_name",
      headerName: "Manager",
      flex: 1.5,
      minWidth: 150,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 2 }}>
          <PersonIcon color="action" fontSize="small" />
          <Typography variant="body2">
            {params.value || "Not Assigned"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "start_date",
      headerName: "Start Date",
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 2 }}>
          <DateIcon color="action" fontSize="small" />
          <Typography variant="body2">
            {params.value
              ? format(new Date(params.value), "MMM dd, yyyy")
              : "N/A"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "end_date",
      headerName: "End Date",
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 2 }}>
          <DateIcon color="action" fontSize="small" />
          <Typography variant="body2">
            {params.value
              ? format(new Date(params.value), "MMM dd, yyyy")
              : "N/A"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "budget",
      headerName: "Budget",
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 2 }}>
          <Typography variant="body2">
            {params.value
              ? `₹ ${parseFloat(params.value).toLocaleString()}`
              : "N/A"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 2 }}>
          <Tooltip title="More Actions">
            <IconButton
              size="small"
              onClick={(e) => handleOpenMenu(e, params.row)}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  if (loading && projects.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Projects Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and track all projects across the organization
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateProject}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 3,
            }}
          >
            Add New Project
          </Button>
        )}
      </Box>

      {/* Alerts */}
      <Fade in={!!error || !!success}>
        <Box sx={{ mb: 2 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}
        </Box>
      </Fade>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "primary.main" }}>
                <AssignmentIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">{projects.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Projects
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "success.main" }}>
                <TrendingUpIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {
                    projects.filter((p) =>
                      ["planning", "in_progress"].includes(p.status)
                    ).length
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Projects
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "warning.main" }}>
                <WorkIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {projects.filter((p) => p.status === "on_hold").length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  On Hold
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "info.main" }}>
                <BusinessIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {projects.filter((p) => p.status === "completed").length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Projects" />
          <Tab label="Active" />
          <Tab label="On Hold" />
          <Tab label="Completed" />
          <Tab label="Cancelled" />
        </Tabs>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
        <TextField
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
        <Typography variant="body2" color="text.secondary">
          {filteredProjects.length} of {projects.length} projects
        </Typography>
      </Box>

      {/* Data Grid */}
      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        <DataGrid
          rows={filteredProjects}
          columns={columns}
          getRowId={(row) => row.project_id}
          getRowHeight={() => "auto"}
          loading={loading}
          pageSizeOptions={[5, 10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          slots={{
            toolbar: GridToolbar,
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          sx={{
            border: "none",
            "& .MuiDataGrid-cell:focus": {
              outline: "none",
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "action.hover",
            },
          }}
        />
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: { minWidth: 150 },
        }}
      >
        <MenuItem onClick={() => handleViewProject(menuProject)}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        {isAdmin && (
          <>
            <MenuItem onClick={() => handleEditProject(menuProject)}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Edit Project
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => handleDeleteProject(menuProject)}
              sx={{ color: "error.main" }}
            >
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete Project
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Form Dialog */}
      <ProjectFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        project={selectedProject}
        mode={formMode}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Dialog */}
      <ProjectDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        project={selectedProject}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  );
};

export default ProjectsMUI;
