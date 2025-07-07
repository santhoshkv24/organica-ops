import React, { useState, useEffect, useRef } from "react";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CAlert,
  CTooltip,
  CNav,
  CNavItem,
  CNavLink,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPlus, cilSearch, cilFilter, cilReload } from "@coreui/icons";
import ResizableGrid from "./ResizableGrid";
import EnhancedForm from "./EnhancedForm";
import Button from '@mui/material/Button';


/**
 * FormGrid - A component that combines a form for data entry with a grid for data display
 */
const FormGrid = ({
  // Grid props
  title,
  data = [],
  columns = [],
  loading = false,
  onFetchData,
  pageSize = 10,

  // Form props
  formFields = [],
  formTitle,
  initialFormValues = {},

  // CRUD operations
  onCreate,
  onUpdate,
  onDelete,
  onView,

  // Config
  enableEdit = true,
  enableDelete = true,
  enableCreate = true,
  enableView = true,
  formPosition = "modal", // 'modal', 'top', 'bottom', 'left', 'right'
  showSearchForm = false, // Show a simplified form for searching/filtering
  showRefreshButton = true,
  refreshInterval = 0, // Auto refresh in milliseconds (0 = disabled)
  formWidth = formPosition === "left" || formPosition === "right" ? 4 : 12, // Bootstrap columns
  gridWidth = 12 -
    (formWidth && (formPosition === "left" || formPosition === "right")
      ? formWidth
      : 0),

  // Validation & messages
  validateForm,
  processBeforeSave,
  confirmDelete = true,
  deleteMessage = "Are you sure you want to delete this item?",

  // Custom components
  renderCustomForm,
  renderCustomGridActions,
  renderTopControls,
}) => {
  // State
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("create"); // 'create', 'edit', 'view'
  const [currentItem, setCurrentItem] = useState(null);
  const [formValues, setFormValues] = useState({ ...initialFormValues });
  const [formErrors, setFormErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState("data"); // 'data', 'search'
  const [searchValues, setSearchValues] = useState({});

  const refreshTimerRef = useRef(null);

  // Load data on mount and when dependencies change
  useEffect(() => {
    fetchData();

    // Set up auto-refresh if enabled
    if (refreshInterval > 0 && onFetchData) {
      refreshTimerRef.current = setInterval(() => {
        fetchData();
      }, refreshInterval);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  const fetchData = async () => {
    if (onFetchData) {
      // Add a flag to prevent multiple concurrent fetch calls
      if (!fetchData.isLoading) {
        fetchData.isLoading = true;
        try {
          await onFetchData(searchValues);
        } finally {
          fetchData.isLoading = false;
        }
      }
    }
  };

  // Handle form field change
  const handleFormChange = (name, value, updatedValues) => {
    console.log(
      `FormGrid handleFormChange called for field ${name} with value:`,
      value
    );
    console.log("Updated values received:", updatedValues);

    // If we received updated values from a field's onChange handler, use those
    if (updatedValues && typeof updatedValues === "object") {
      console.log("Setting form values to:", updatedValues);
      setFormValues(updatedValues);
    } else {
      // Otherwise just update the single field
      setFormValues((prev) => {
        const newValues = { ...prev, [name]: value };
        console.log("Setting form values to:", newValues);
        return newValues;
      });
    }

    // Clear validation errors for this field
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Open form for creating new item
  const handleCreate = () => {
    setFormMode("create");
    setCurrentItem(null);
    setFormValues({ ...initialFormValues });
    setFormErrors({});
    setSuccess("");
    setError("");
    setShowForm(true);
  };

  // Open form for editing item
  const handleEdit = (item) => {
    setFormMode("edit");
    setCurrentItem(item);
    setFormValues({ ...item });
    setFormErrors({});
    setSuccess("");
    setError("");
    setShowForm(true);
  };

  // Open form for viewing item
  const handleView = (item) => {
    setFormMode("view");
    setCurrentItem(item);
    setFormValues({ ...item });
    setFormErrors({});
    setShowForm(true);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      // Reset messages
      setSuccess("");
      setError("");

      // Validate form if validator provided
      if (validateForm) {
        const errors = validateForm(values, formMode);
        if (errors && Object.keys(errors).length > 0) {
          setFormErrors(errors);
          return false;
        }
      }

      // Process values before saving if processor provided
      const processedValues = processBeforeSave
        ? processBeforeSave(values, formMode)
        : values;

      let result;

      if (formMode === "create") {
        result = await onCreate(processedValues);
        setSuccess("Item created successfully");
      } else if (formMode === "edit") {
        result = await onUpdate(currentItem, processedValues);
        setSuccess("Item updated successfully");
      }

      // Refresh data
      await fetchData();

      // Close form after success if it's modal
      if (formPosition === "modal") {
        setTimeout(() => {
          setShowForm(false);
        }, 1500);
      }

      return result;
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err.message || "An error occurred while saving data");
      return false;
    }
  };

  // Handle item delete
  const handleDelete = async (item) => {
    if (confirmDelete) {
      setItemToDelete(item);
      setShowDeleteDialog(true);
    } else {
      try {
        await onDelete(item);
        fetchData();
      } catch (err) {
        console.error("Error deleting item:", err);
        setError(err.message || "An error occurred while deleting");
      }
    }
  };

  // Confirm item delete
  const confirmDeleteAction = async () => {
    try {
      await onDelete(itemToDelete);
      setShowDeleteDialog(false);
      setItemToDelete(null);
      fetchData();
    } catch (err) {
      console.error("Error deleting item:", err);
      setError(err.message || "An error occurred while deleting");
    }
  };

  // Handle search form submit
  const handleSearchSubmit = (values) => {
    setSearchValues(values);
    fetchData();
  };

  // Render form based on mode and position
  const renderForm = () => {
    // If custom form renderer is provided, use it
    if (renderCustomForm) {
      return renderCustomForm({
        mode: formMode,
        values: formValues,
        onChange: handleFormChange,
        onSubmit: handleSubmit,
        onCancel: () => setShowForm(false),
        errors: formErrors,
        currentItem,
        isLoading: loading,
      });
    }

    const isViewMode = formMode === "view";
    const formContent = (
      <EnhancedForm
        title={
          formTitle ||
          (formMode === "create"
            ? "Create New Item"
            : formMode === "edit"
            ? "Edit Item"
            : "View Item")
        }
        fields={formFields}
        values={formValues}
        onChange={handleFormChange}
        onSubmit={!isViewMode ? handleSubmit : undefined}
        onCancel={() => setShowForm(false)}
        submitText={formMode === "create" ? "Create" : "Update"}
        cancelText="Cancel"
        isLoading={loading}
        errors={formErrors}
        successMessage={success}
        errorMessage={error}
        layout="horizontal"
        columns={2}
      />
    );

    // If modal position, render in modal
    if (formPosition === "modal") {
      return (
        <CModal
          visible={showForm}
          onClose={() => setShowForm(false)}
          size="lg"
          backdrop="static"
        >
          <CModalHeader>
            <CModalTitle>
              {formMode === "create"
                ? "Create New Item"
                : formMode === "edit"
                ? "Edit Item"
                : "View Item"}
            </CModalTitle>
          </CModalHeader>
          <CModalBody>{formContent}</CModalBody>
        </CModal>
      );
    }

    // Otherwise return the form content directly
    return formContent;
  };

  // Render search form
  const renderSearchForm = () => {
    const searchableFields = formFields
      .filter((field) => field.searchable !== false)
      .map((field) => ({
        ...field,
        required: false, // Search fields are never required
        colSpan: 1, // Force single column for search fields
      }));

    return (
      <EnhancedForm
        title="Search"
        fields={searchableFields}
        values={searchValues}
        onChange={(name, value) => {
          setSearchValues((prev) => ({ ...prev, [name]: value }));
        }}
        onSubmit={handleSearchSubmit}
        submitText="Search"
        cancelText="Reset"
        onCancel={() => {
          setSearchValues({});
          fetchData();
        }}
        layout="horizontal"
        columns={3}
        submitButtonProps={{ color: "info" }}
        extraActions={
          <CButton color="secondary" variant="outline" onClick={fetchData}>
            Refresh
          </CButton>
        }
      />
    );
  };

  // Delete confirmation dialog
  const renderDeleteDialog = () => (
    <CModal
      visible={showDeleteDialog}
      onClose={() => {
        setShowDeleteDialog(false);
        setItemToDelete(null);
      }}
    >
      <CModalHeader>
        <CModalTitle>Confirm Delete</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <p>{deleteMessage}</p>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <CButton
            color="secondary"
            onClick={() => {
              setShowDeleteDialog(false);
              setItemToDelete(null);
            }}
          >
            Cancel
          </CButton>
          <CButton color="danger" onClick={confirmDeleteAction}>
            Delete
          </CButton>
        </div>
      </CModalBody>
    </CModal>
  );

  // Define grid actions based on enabled features
  const gridActions = {
    onView: enableView ? onView || handleView : undefined,
    onEdit: enableEdit ? handleEdit : undefined,
    onDelete: enableDelete ? handleDelete : undefined,
  };

  // Render content based on layout
  const renderContent = () => {
    // Determine if we should show the form
    const shouldShowForm = showForm || formPosition !== "modal";

    // Determine grid and form layout classes
    const gridClasses =
      shouldShowForm && (formPosition === "left" || formPosition === "right")
        ? `col-md-${gridWidth}`
        : "col-md-12";

    const formClasses = `col-md-${formWidth}`;

    // Top controls with title and buttons
    const topControls = (
      <div className="row mb-4">
        <div className="col-md-6">
          <h4>{title}</h4>
        </div>
        <div className="col-md-6 d-flex justify-content-end">
          {/* Custom top controls */}
          {renderTopControls && renderTopControls()}

          {/* Enable create button */}
          {enableCreate && (
            <Button
              variant="contained"
              sx={{
                backgroundColor: "black",
                color: "white",
                textTransform: "none",
              }}
              color="secondary"
              onClick={handleCreate}
              className="me-2"
            >
                  
              Add New
            </Button>
          )}

          {/* Refresh button */}
          {showRefreshButton && (
            <CButton
              color="secondary"
              variant="outline"
              onClick={fetchData}
              className="ms-2"
            >
              <CIcon icon={cilReload} />
            </CButton>
          )}
        </div>
      </div>
    );

    // Return grid with appropriate layout based on form position
    switch (formPosition) {
      case "top":
        return (
          <>
            {topControls}
            {showForm && <div className="mb-4">{renderForm()}</div>}
            {activeTab === "search" && showSearchForm ? (
              renderSearchForm()
            ) : (
              <ResizableGrid
                title={false} // Hide title as we have our own
                data={data}
                columns={columns}
                pageSize={pageSize}
                loading={loading}
                {...gridActions}
              />
            )}
          </>
        );

      case "bottom":
        return (
          <>
            {topControls}
            {activeTab === "search" && showSearchForm ? (
              renderSearchForm()
            ) : (
              <>
                <ResizableGrid
                  title={false} // Hide title as we have our own
                  data={data}
                  columns={columns}
                  pageSize={pageSize}
                  loading={loading}
                  {...gridActions}
                />
                {showForm && <div className="mt-4">{renderForm()}</div>}
              </>
            )}
          </>
        );

      case "left":
      case "right":
        return (
          <>
            {topControls}
            {activeTab === "search" && showSearchForm ? (
              renderSearchForm()
            ) : (
              <CRow>
                {formPosition === "left" && showForm && (
                  <CCol md={formWidth}>{renderForm()}</CCol>
                )}
                <CCol md={showForm ? gridWidth : 12}>
                  <ResizableGrid
                    title={false} // Hide title as we have our own
                    data={data}
                    columns={columns}
                    pageSize={pageSize}
                    loading={loading}
                    {...gridActions}
                  />
                </CCol>
                {formPosition === "right" && showForm && (
                  <CCol md={formWidth}>{renderForm()}</CCol>
                )}
              </CRow>
            )}
          </>
        );

      case "modal":
      default:
        return (
          <>
            {topControls}
            {activeTab === "search" && showSearchForm ? (
              renderSearchForm()
            ) : (
              <ResizableGrid
                title={false} // Hide title as we have our own
                data={data}
                columns={columns}
                pageSize={pageSize}
                loading={loading}
                {...gridActions}
              />
            )}
            {renderForm()}
          </>
        );
    }
  };

  return (
    <CCard className="mb-4">
      <CCardBody>
        {renderContent()}
        {renderDeleteDialog()}

        {error && !showForm && (
          <CAlert color="danger" className="mt-3">
            {error}
          </CAlert>
        )}
      </CCardBody>
    </CCard>
  );
};

export default FormGrid;
