import React, { useState, useEffect } from 'react';
import { CCard, CCardBody, CSpinner, CButton, CBadge, CTooltip } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilBriefcase, cilPlus, cilPencil, cilTrash } from '@coreui/icons';
import { useNavigate } from 'react-router-dom';
import ResizableGrid from '../../components/ResizableGrid';
import { 
  getProjects, 
  deleteProject
} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Button from '@mui/material/Button';


const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isAdmin = user && (user.role === 'admin' || user.role === 'manager');

  useEffect(() => {
    fetchProjects();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'not_started':
        return 'bg-secondary';
      case 'in_progress':
        return 'bg-primary';
      case 'on_hold':
        return 'bg-warning';
      case 'completed':
        return 'bg-success';
      case 'cancelled':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  const formatStatus = (status) =>
    status ? status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'Unknown';

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getProjects();
      
      let projectsData = res.data.data || res.data || [];
      setProjects(projectsData);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Unable to load projects.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (project) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(project.project_id);
        await fetchProjects();
      } catch (err) {
        console.error("Delete error:", err);
        alert("Failed to delete project.");
      }
    }
  };

  const handleEditProject = (project) => {
    navigate(`/projects/edit/${project.project_id}`);
  };

  const gridColumns = [
    { 
      key: 'name', 
      label: 'Project Name',
      sortable: true,
      render: (value, project) => (
        <div className="d-flex align-items-center">
          <div className="bg-light p-2 rounded-circle me-3">
            <CIcon icon={cilBriefcase} size="lg" />
          </div>
          <div>
            <div className="fw-bold">{value}</div>
            <CBadge className={`me-1 ${getStatusBadge(project.status)}`}>
              {formatStatus(project.status)}
            </CBadge>
          </div>
        </div>
      )
    },
    { 
      key: 'customer_company_name', 
      label: 'Customer Company',
      sortable: true,
      render: (value) => value || 'N/A'
    },
    { 
      key: 'manager_name', 
      label: 'Manager',
      sortable: true,
      render: (value) => value || 'Not Assigned'
    },
    { 
      key: 'start_date', 
      label: 'Start Date',
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    },
    { 
      key: 'end_date', 
      label: 'End Date',
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    }
  ];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Projects</h2>
        {isAdmin && (
          <Button variant="contained" sx={{ backgroundColor: 'black', color: 'white' }} onClick={() => navigate('/projects/create')}>
            <CIcon icon={cilPlus} className="me-2" />
            Add New Project
          </Button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      <CCard className="mb-4">
        <CCardBody>
          <ResizableGrid
            title="Projects"
            data={projects}
            columns={gridColumns}
            loading={loading}
            onEdit={isAdmin ? handleEditProject : undefined}
            onDelete={isAdmin ? handleDeleteProject : undefined}
            emptyMessage="No projects found."
            searchable={true}
            sortable={true}
            filterable={true}
          />
        </CCardBody>
      </CCard>
    </>
  );
};

export default Projects;
