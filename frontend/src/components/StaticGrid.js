import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButton,
  CFormInput,
  CFormSelect,
  CTooltip,
  CSpinner,
  CAlert,
  CInputGroup,
  CInputGroupText,
  CRow,
  CCol,
  CBadge
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { 
  cilPlus, 
  cilSave, 
  cilTrash, 
  cilX,
  cilCheck,
  cilPencil
} from '@coreui/icons';
import PropTypes from 'prop-types';

/**
 * StaticGrid - An inline editable grid component
 * Allows adding new rows and editing existing ones directly in the grid
 */
const StaticGrid = forwardRef(({
  title,
  data = [],
  columns = [],
  loading = false,
  onSave,
  onDelete,
  validationSchema,
  emptyMessage = "No data available",
  className = "",
  style = {},
  idField = "employee_id", // Default ID field name
  onFieldChange,
  newRowDefaults = {} // Default values for new rows
}, ref) => {
  // State for managing grid data
  const [gridData, setGridData] = useState(data);
  const [editingRows, setEditingRows] = useState({});
  const [newRows, setNewRows] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editMode, setEditMode] = useState({}); // Track which rows are in edit mode

  // Update grid data when props change
  useEffect(() => {
    // Only update gridData if the data prop has actually changed
    // and we don't have any unsaved new rows
    if (JSON.stringify(data) !== JSON.stringify(gridData) && newRows.length === 0) {
      setGridData(data);
    }
  }, [data]);
  
  // Log when new rows are added
  useEffect(() => {
    console.log('New rows updated:', newRows);
  }, [newRows]);

  // Add a new empty row for data entry
  const handleAddRow = () => {
    console.log('handleAddRow called');
    const emptyRow = {
      _isNew: true,
      _id: `new-${Date.now()}-${Math.floor(Math.random() * 1000)}` // More unique ID
    };
    
    // Initialize with empty values for all columns
    columns.forEach(col => {
      if (col.key !== 'actions') {
        // Use default value from newRowDefaults if available, otherwise use column default or empty string
        emptyRow[col.key] = newRowDefaults[col.key] !== undefined ? 
          newRowDefaults[col.key] : 
          (col.defaultValue || '');
      }
    });
    
    console.log('Adding new row:', emptyRow);
    
    // Use functional update to ensure we have the latest state
    setNewRows(prevRows => {
      const updatedRows = [...prevRows, emptyRow];
      console.log('New rows state:', updatedRows);
      return updatedRows;
    });
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    handleAddRow,
    handleSaveChanges
  }));

  // Toggle edit mode for a row
  const toggleEditMode = (rowId) => {
    setEditMode(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
    
    // If turning off edit mode, clear any edits for this row
    if (editMode[rowId]) {
      setEditingRows(prev => {
        const newEdits = { ...prev };
        delete newEdits[rowId];
        return newEdits;
      });
    }
  };

  // Handle field changes in a row
  const handleChange = (rowId, field, value) => {
    if (!rowId) return; // Guard against undefined rowId
    
    const rowIdStr = String(rowId); // Ensure rowId is a string
    
    // Check if it's a new row or existing row
    const isNewRow = rowIdStr.startsWith('new-');
    let row;
    
    if (isNewRow) {
      row = newRows.find(r => r._id === rowIdStr);
    } else {
      row = gridData.find(r => {
        const id = r[idField] || r.id;
        return id === parseInt(rowIdStr) || id === rowIdStr;
      });
    }
    
    // Get any dependent field changes
    let changes = { [field]: value };
    
    // If onFieldChange handler is provided, get additional field changes
    if (onFieldChange) {
      const additionalChanges = onFieldChange(rowIdStr, field, value, isNewRow, row);
      if (additionalChanges) {
        changes = { ...changes, ...additionalChanges };
      }
    }
    
    // Apply all changes
    if (isNewRow) {
      setNewRows(newRows.map(r => 
        r._id === rowIdStr ? { ...r, ...changes } : r
      ));
      
      // Clear any errors for these fields
      if (errors[rowIdStr]) {
        const updatedErrors = { ...errors[rowIdStr] };
        Object.keys(changes).forEach(field => {
          delete updatedErrors[field];
        });
        
        setErrors({
          ...errors,
          [rowIdStr]: updatedErrors
        });
      }
    } else {
      // For existing rows
      setEditingRows({
        ...editingRows,
        [rowIdStr]: {
          ...(editingRows[rowIdStr] || {}),
          ...changes
        }
      });
      
      // Clear any errors for these fields
      if (errors[rowIdStr]) {
        const updatedErrors = { ...errors[rowIdStr] };
        Object.keys(changes).forEach(field => {
          delete updatedErrors[field];
        });
        
        setErrors({
          ...errors,
          [rowIdStr]: updatedErrors
        });
      }
    }
  };

  // Validate a single row
  const validateRow = (row) => {
    if (!validationSchema) return {};
    
    const rowErrors = {};
    
    columns.forEach(col => {
      if (col.key !== 'actions' && validationSchema[col.key]) {
        const value = row[col.key];
        const fieldSchema = validationSchema[col.key];
        
        // Required field validation
        if (fieldSchema.required && (value === undefined || value === null || value === '')) {
          rowErrors[col.key] = `${col.label || col.key} is required`;
        }
        
        // Email validation
        if (fieldSchema.type === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
          rowErrors[col.key] = 'Please enter a valid email address';
        }
        
        // Custom validation function
        if (fieldSchema.validate && value !== undefined && value !== null) {
          const customError = fieldSchema.validate(value, row);
          if (customError) {
            rowErrors[col.key] = customError;
          }
        }
      }
    });
    
    return rowErrors;
  };

  // Save all changes (new rows and edited rows)
  const handleSaveChanges = async () => {
    try {
      setIsSubmitting(true);
      setMessage({ type: '', text: '' });
      
      // Validate all new rows
      const newRowsErrors = {};
      let hasErrors = false;
      
      newRows.forEach(row => {
        const rowErrors = validateRow(row);
        if (Object.keys(rowErrors).length > 0) {
          newRowsErrors[row._id] = rowErrors;
          hasErrors = true;
        }
      });
      
      // Validate all edited rows
      const editedRowsErrors = {};
      Object.entries(editingRows).forEach(([rowId, changes]) => {
        const originalRow = gridData.find(row => {
          const id = row[idField] || row.id;
          return id === parseInt(rowId) || id === rowId;
        });
        
        if (originalRow) {
          const rowToValidate = { ...originalRow, ...changes };
          const rowErrors = validateRow(rowToValidate);
          if (Object.keys(rowErrors).length > 0) {
            editedRowsErrors[rowId] = rowErrors;
            hasErrors = true;
          }
        }
      });
      
      // If there are validation errors, stop and show them
      if (hasErrors) {
        setErrors({ ...newRowsErrors, ...editedRowsErrors });
        setMessage({ 
          type: 'danger', 
          text: 'Please correct the errors before saving' 
        });
        return;
      }
      
      // Prepare data for saving
      const updates = {
        new: newRows.map(row => {
          const { _isNew, _id, ...rowData } = row;
          return rowData;
        }),
        updated: Object.entries(editingRows).map(([rowId, changes]) => {
          const originalRow = gridData.find(row => {
            const id = row[idField] || row.id;
            return id === parseInt(rowId) || id === rowId;
          });
          
          return {
            id: rowId,
            ...changes
          };
        })
      };
      
      // Call the save handler
      if (onSave) {
        await onSave(updates);
        setNewRows([]);
        setEditingRows({});
        setEditMode({}); // Reset edit mode for all rows
        setMessage({ type: 'success', text: 'Changes saved successfully' });
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      setMessage({ 
        type: 'danger', 
        text: error.message || 'An error occurred while saving changes' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save changes for a specific row
  const handleSaveRow = async (rowId) => {
    try {
      setIsSubmitting(true);
      
      const changes = editingRows[rowId];
      if (!changes) {
        toggleEditMode(rowId);
        return;
      }
      
      const originalRow = gridData.find(row => {
        const id = row[idField] || row.id;
        return id === parseInt(rowId) || id === rowId;
      });
      
      if (originalRow) {
        const rowToValidate = { ...originalRow, ...changes };
        const rowErrors = validateRow(rowToValidate);
        
        if (Object.keys(rowErrors).length > 0) {
          setErrors({
            ...errors,
            [rowId]: rowErrors
          });
          setMessage({ 
            type: 'danger', 
            text: 'Please correct the errors before saving' 
          });
          return;
        }
        
        // Call the save handler for just this row
        if (onSave) {
          await onSave({
            new: [],
            updated: [{
              id: rowId,
              ...changes
            }]
          });
          
          // Clear editing state for this row
          setEditingRows(prev => {
            const newEdits = { ...prev };
            delete newEdits[rowId];
            return newEdits;
          });
          
          toggleEditMode(rowId);
          setMessage({ type: 'success', text: 'Row updated successfully' });
        }
      }
    } catch (error) {
      console.error('Error saving row:', error);
      setMessage({ 
        type: 'danger', 
        text: error.message || 'An error occurred while saving changes' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a row (either new or existing)
  const handleDeleteRow = async (rowId) => {
    if (!rowId) return;
    
    const rowIdStr = String(rowId);
    
    if (rowIdStr.startsWith('new-')) {
      // For new rows, just remove from state
      setNewRows(newRows.filter(row => row._id !== rowIdStr));
    } else {
      // For existing rows, call delete handler
      if (onDelete) {
        try {
          await onDelete(rowId);
          // Remove from local state as well
          setGridData(gridData.filter(row => {
            const id = row[idField] || row.id;
            return id !== parseInt(rowId) && id !== rowId;
          }));
        } catch (error) {
          console.error('Error deleting row:', error);
          setMessage({ 
            type: 'danger', 
            text: error.message || 'An error occurred while deleting the row' 
          });
        }
      }
    }
  };

  // Render a cell with the appropriate editor based on column type
  const renderEditableCell = (row, column) => {
    const rowId = row[idField] || row.id || row._id;
    const isNewRow = row._isNew;
    const isEditing = isNewRow || editMode[rowId];
    
    // Get the current value, considering any edits
    const value = isNewRow 
      ? row[column.key]
      : (editingRows[rowId]?.[column.key] !== undefined 
        ? editingRows[rowId][column.key] 
        : row[column.key]);
    
    const hasError = errors[rowId]?.[column.key];
    
    // If not in edit mode, just display the value
    if (!isEditing) {
      // If column has a custom render function, use it
      if (column.render) {
        return column.render(value, row);
      }
      
      // Special handling for select fields to show the label instead of value
      if (column.type === 'select' && column.options) {
        // Handle both static and dynamic options
        let options = typeof column.options === 'function' 
          ? column.options(row)
          : column.options;
        
        const option = options.find(opt => opt.value === value);
        return <div>{option ? option.label : (value || '')}</div>;
      }
      
      // Format date values
      if (column.type === 'date' && value) {
        try {
          const date = new Date(value);
          return <div>{date.toLocaleDateString()}</div>;
        } catch (e) {
          return <div>{value}</div>;
        }
      }
      
      return <div>{value || ''}</div>;
    }
    
    // For edit mode, determine the type of editor to use
    switch (column.type) {
      case 'select':
        // Handle both static and dynamic options
        let options = typeof column.options === 'function' 
          ? column.options(isNewRow ? row : { ...row, ...editingRows[rowId] })
          : column.options;
        
        return (
          <CFormSelect
            value={value || ''}
            onChange={(e) => handleChange(rowId, column.key, e.target.value)}
            options={[
              { label: `Select ${column.label}`, value: '' },
              ...(options || [])
            ]}
            invalid={!!hasError}
            disabled={column.readOnly}
            size="sm"
          />
        );
      
      case 'number':
        return (
          <CFormInput
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(rowId, column.key, e.target.value)}
            invalid={!!hasError}
            disabled={column.readOnly}
            size="sm"
            placeholder={column.placeholder || `Enter ${column.label || ''}`}
          />
        );
        
      case 'date':
        return (
          <CFormInput
            type="date"
            value={value || ''}
            onChange={(e) => handleChange(rowId, column.key, e.target.value)}
            invalid={!!hasError}
            disabled={column.readOnly}
            size="sm"
          />
        );
        
      default:
        return (
          <CFormInput
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(rowId, column.key, e.target.value)}
            invalid={!!hasError}
            disabled={column.readOnly}
            size="sm"
            placeholder={column.placeholder || `Enter ${column.label || ''}`} // Placeholder for text input
          />
        );
    }
  };

  // Combine existing data with new rows for display
  // Make sure to include any pending edits from editingRows
  const allRows = [...gridData, ...newRows].map(row => {
    const rowId = row[idField] || row.id || row._id;
    if (editingRows[rowId]) {
      return { ...row, ...editingRows[rowId] };
    }
    return row;
  });
  
  console.log('Rendering allRows:', allRows);

  // Render action buttons for adding and saving rows
  const renderActionButtons = () => (
    <div className="d-flex justify-content-end mb-3">
      <CButton
        color="primary"
        size="sm"
        onClick={handleAddRow}
        disabled={isSubmitting}
      >
        <CIcon icon={cilPlus} className="me-1" /> Add Row
      </CButton>
      {(newRows.length > 0) && (
        <CButton
          color="success"
          size="sm"
          className="ms-2"
          onClick={handleSaveChanges}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <CSpinner size="sm" className="me-1" />
          ) : (
            <CIcon icon={cilSave} className="me-1" />
          )}
          Save New Rows
        </CButton>
      )}
    </div>
  );

  return (
    <CCard className={className} style={style}>
      {title && (
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <div>{title}</div>
          {renderActionButtons()}
        </CCardHeader>
      )}

      <CCardBody>
        {message.text && (
          <CAlert color={message.type} dismissible>
            {message.text}
          </CAlert>
        )}

        {/* Always show action buttons if title is hidden */}
        {!title && renderActionButtons()}

        <CTable hover responsive>
          <CTableHead>
            <CTableRow>
              {columns.map((column) => (
                <CTableHeaderCell key={column.key} style={{ minWidth: column.width || 'auto' }}>
                  {column.label || column.key}
                </CTableHeaderCell>
              ))}
              <CTableHeaderCell style={{ width: '150px' }}>Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
            {loading ? (
              <CTableRow>
                <CTableDataCell colSpan={columns.length + 1} className="text-center py-4">
                  <CSpinner color="primary" />
                  <div className="mt-2">Loading data...</div>
                </CTableDataCell>
              </CTableRow>
            ) : allRows.length === 0 ? (
              <CTableRow>
                <CTableDataCell colSpan={columns.length + 1} className="text-center py-4">
                  {emptyMessage}
                </CTableDataCell>
              </CTableRow>
            ) : (
              allRows.map((row) => {
                const rowId = row[idField] || row.id || row._id;
                const isNewRow = row._isNew;
                const isEditing = isNewRow || editMode[rowId];

                return (
                  <CTableRow key={rowId} className={isNewRow ? 'bg-light' : (isEditing ? 'bg-info-subtle' : '')}>
                    {columns.map((column) => (
                      <CTableDataCell key={`${rowId}-${column.key}`}>
                        {renderEditableCell(row, column)}
                        {errors[rowId]?.[column.key] && (
                          <div className="small text-danger mt-1">
                            {errors[rowId][column.key]}
                          </div>
                        )}
                      </CTableDataCell>
                    ))}

                    <CTableDataCell>
                      <div className="d-flex gap-1">
                        {isNewRow ? (
                          <CButton
                            color="danger"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteRow(rowId)}
                          >
                            <CIcon icon={cilTrash} />
                          </CButton>
                        ) : isEditing ? (
                          <>
                            <CButton
                              color="success"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveRow(rowId)}
                              disabled={isSubmitting}
                            >
                              <CIcon icon={cilSave} />
                            </CButton>
                            <CButton
                              color="danger"
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleEditMode(rowId)}
                            >
                              <CIcon icon={cilX} />
                            </CButton>
                          </>
                        ) : (
                          <>
                            <CButton
                              color="info"
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleEditMode(rowId)}
                            >
                              <CIcon icon={cilPencil} />
                            </CButton>
                            <CButton
                              color="danger"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteRow(rowId)}
                            >
                              <CIcon icon={cilTrash} />
                            </CButton>
                          </>
                        )}
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                );
              })
            )}
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>
  );
});

StaticGrid.propTypes = {
  title: PropTypes.string,
  data: PropTypes.array,
  columns: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string,
    type: PropTypes.oneOf(['text', 'number', 'date', 'select']),
    options: PropTypes.arrayOf(PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string
    })),
    width: PropTypes.string,
    readOnly: PropTypes.bool,
    defaultValue: PropTypes.any
  })),
  loading: PropTypes.bool,
  onSave: PropTypes.func,
  onDelete: PropTypes.func,
  validationSchema: PropTypes.object,
  emptyMessage: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  idField: PropTypes.string,
  onFieldChange: PropTypes.func,
  newRowDefaults: PropTypes.object,
  placeholder: PropTypes.string
};

export default StaticGrid; 