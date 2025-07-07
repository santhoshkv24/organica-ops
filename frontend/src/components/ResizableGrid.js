import React, { useState, useRef, useEffect } from 'react';
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
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CFormInput,
  CFormSelect,
  CPagination,
  CPaginationItem,
  CBadge,
  CTooltip,
  CSpinner,
  CInputGroup,
  CInputGroupText
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilOptions,
  cilPencil,
  cilTrash,
  cilSearch,
  cilFilter,
  cilSortAscending,
  cilSortDescending,
  cilExpandHorizontal,
  cilExpandVertical,
  cilFullscreen,
  cilFullscreenExit, cilPlus
} from '@coreui/icons';

const ResizableGrid = ({
  title,
  data = [],
  columns = [],
  actions = true,
  onEdit,
  onDelete,
  onView,
  searchable = true,
  sortable = true,
  filterable = true,
  pageSize = 10,
  loading = false,
  emptyMessage = "No data available",
  className = "",
  style = {}
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [columnWidths, setColumnWidths] = useState({});
  const [resizing, setResizing] = useState(null);
  const [startX, setStartX] = useState(null);
  const [initialWidth, setInitialWidth] = useState(null);
  const tableRef = useRef(null);

  // Initialize column widths evenly
  useEffect(() => {
    if (columns.length > 0 && Object.keys(columnWidths).length === 0) {
      const initialWidths = {};
      const baseWidth = 200; // Default width for columns
      
      columns.forEach(col => {
        initialWidths[col.key] = baseWidth;
      });
      
      setColumnWidths(initialWidths);
    }
  }, [columns]);

  // Handle resizing logic
  const handleResizeStart = (e, key) => {
    e.preventDefault();
    setResizing(key);
    setStartX(e.clientX);
    setInitialWidth(columnWidths[key] || 200);
  };

  const handleResizeMove = (e) => {
    if (resizing) {
      const diff = e.clientX - startX;
      const newWidth = Math.max(80, initialWidth + diff); // Minimum width of 80px
      
      setColumnWidths({
        ...columnWidths,
        [resizing]: newWidth
      });
    }
  };

  const handleResizeEnd = () => {
    setResizing(null);
    setStartX(null);
    setInitialWidth(null);
  };

  useEffect(() => {
    if (resizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [resizing, startX]);

  // Handle full screen mode
  const toggleFullScreen = () => {
    if (!isFullScreen) {
      const element = tableRef.current?.closest('.card');
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

  // Search functionality
  const filteredData = data.filter(item => {
    // Apply search
    const matchesSearch = searchTerm === '' || 
      Object.entries(item).some(([key, value]) => {
        const col = columns.find(c => c.key === key);
        if (col && col.searchable !== false && value) {
          return value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });
    
    // Apply filters
    const matchesFilters = Object.entries(filters).every(([key, value]) => {
      if (!value || value === '') return true;
      
      const itemValue = item[key];
      if (itemValue === null || itemValue === undefined) return false;
      
      // Check if filter is a range (for numbers or dates)
      if (typeof value === 'object' && (value.min !== undefined || value.max !== undefined)) {
        const numValue = Number(itemValue);
        if (isNaN(numValue)) return false;
        
        if (value.min !== undefined && numValue < value.min) return false;
        if (value.max !== undefined && numValue > value.max) return false;
        return true;
      }
      
      // Simple string filter
      return itemValue.toString().toLowerCase().includes(value.toLowerCase());
    });
    
    return matchesSearch && matchesFilters;
  });

  // Sorting functionality
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const column = columns.find(col => col.key === sortConfig.key);
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    // Custom sort function
    if (column && column.sortFn) {
      return column.sortFn(aValue, bValue) * (sortConfig.direction === 'asc' ? 1 : -1);
    }
    
    // Default sort behavior
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (key) => {
    if (!sortable) return;
    
    setSortConfig(prevConfig => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const renderFilterControl = (column) => {
    const currentFilter = filters[column.key] || '';
    
    switch (column.filterType) {
      case 'number':
        return (
          <div className="d-flex gap-1">
            <CFormInput 
              type="number"
              placeholder="Min" 
              value={currentFilter.min || ''} 
              onChange={(e) => {
                const val = e.target.value;
                setFilters({
                  ...filters, 
                  [column.key]: {
                    ...filters[column.key],
                    min: val !== '' ? Number(val) : undefined
                  }
                });
              }}
            />
            <CFormInput 
              type="number"
              placeholder="Max" 
              value={currentFilter.max || ''} 
              onChange={(e) => {
                const val = e.target.value;
                setFilters({
                  ...filters, 
                  [column.key]: {
                    ...filters[column.key],
                    max: val !== '' ? Number(val) : undefined
                  }
                });
              }}
            />
          </div>
        );

      case 'date':
        return (
          <div className="d-flex gap-1">
            <CFormInput 
              type="date" 
              placeholder="From" 
              value={currentFilter.min || ''} 
              onChange={(e) => {
                setFilters({
                  ...filters, 
                  [column.key]: {
                    ...filters[column.key],
                    min: e.target.value
                  }
                });
              }}
            />
            <CFormInput 
              type="date" 
              placeholder="To" 
              value={currentFilter.max || ''} 
              onChange={(e) => {
                setFilters({
                  ...filters, 
                  [column.key]: {
                    ...filters[column.key],
                    max: e.target.value
                  }
                });
              }}
            />
          </div>
        );

      case 'select':
        return (
          <CFormSelect
            value={currentFilter}
            onChange={(e) => setFilters({...filters, [column.key]: e.target.value})}
          >
            <option value="">All</option>
            {column.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </CFormSelect>
        );
        
      default: // text
        return (
          <CFormInput 
            placeholder={`Filter ${column.label}`} 
            value={currentFilter}
            onChange={(e) => setFilters({...filters, [column.key]: e.target.value})}
          />
        );
    }
  };

  return (
    <CCard className={`mb-4 ${className}`} style={style} ref={tableRef}>
      <CCardHeader>
        <div className="d-flex justify-content-between align-items-center">
          <strong>{title}</strong>
          <div className="d-flex gap-2">
            {searchable && (
              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                />
              </CInputGroup>
            )}
            <CDropdown>
              <CDropdownToggle color="primary" variant="outline">
                <CIcon icon={cilOptions} />
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem onClick={() => setSearchTerm('')}>
                  Clear Search
                </CDropdownItem>
                <CDropdownItem onClick={() => setSortConfig({ key: null, direction: 'asc' })}>
                  Clear Sort
                </CDropdownItem>
                <CDropdownItem onClick={() => setFilters({})}>
                  Clear Filters
                </CDropdownItem>
                <CDropdownItem onClick={toggleFullScreen}>
                  {isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          </div>
        </div>
      </CCardHeader>
      <CCardBody>
        <div className="table-responsive">
          <CTable hover responsive className="position-relative border">
            <CTableHead>
              <CTableRow>
                {columns.map((column) => (
                  <CTableHeaderCell
                    key={column.key}
                    style={{ 
                      width: columnWidths[column.key] ? `${columnWidths[column.key]}px` : undefined,
                      position: 'relative',
                      cursor: sortable ? 'pointer' : 'default',
                      borderBottom: '2px solid #dee2e6',
                      borderRight: '1px solid #dee2e6'
                    }}
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        {column.label}
                        {sortConfig.key === column.key && (
                          <CIcon 
                            icon={sortConfig.direction === 'asc' ? cilSortAscending : cilSortDescending} 
                            className="ms-1"
                            size="sm"
                          />
                        )}
                      </div>
                      {column.filterable !== false && filterable && (
                        <CDropdown>
                          <CDropdownToggle color="transparent" caret={false}>
                            <CIcon icon={cilFilter} />
                          </CDropdownToggle>
                          <CDropdownMenu>
                            <div className="p-3" style={{ minWidth: '200px' }} onClick={(e) => e.stopPropagation()}>
                              {renderFilterControl(column)}
                            </div>
                          </CDropdownMenu>
                        </CDropdown>
                      )}
                    </div>
                    <div
                      className="column-resize-handle"
                      onMouseDown={(e) => handleResizeStart(e, column.key)}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        height: '100%',
                        width: '5px',
                        background: resizing === column.key ? '#999' : 'transparent',
                        cursor: 'col-resize'
                      }}
                    />
                  </CTableHeaderCell>
                ))}
                {actions && <CTableHeaderCell style={{ borderBottom: '2px solid #dee2e6' }}>Actions</CTableHeaderCell>}
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-4" style={{ border: '1px solid #dee2e6' }}>
                    <CSpinner color="primary" />
                    <p className="mt-2">Loading data...</p>
                  </CTableDataCell>
                </CTableRow>
              ) : paginatedData.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-4" style={{ border: '1px solid #dee2e6' }}>
                    {emptyMessage}
                  </CTableDataCell>
                </CTableRow>
              ) : (
                paginatedData.map((item, index) => (
                  <CTableRow key={index}>
                    {columns.map((column) => (
                      <CTableDataCell 
                        key={column.key}
                        style={{ 
                          width: columnWidths[column.key] ? `${columnWidths[column.key]}px` : undefined,
                          border: '1px solid #dee2e6'
                        }}
                      >
                        {column.render ? column.render(item[column.key], item, index) : item[column.key]}
                      </CTableDataCell>
                    ))}
                    {actions && (
                      <CTableDataCell style={{ border: '1px solid #dee2e6' }}>
                        <div className="d-flex gap-2">
                          {onView && (




                            <CTooltip content="View details">
                              <CButton
                                color="primary"
                                variant="outline"
                                size="sm"
                                onClick={() => onView(item)}
                              >
                                View
                              </CButton>
                            </CTooltip>
                          )}
                          {onEdit && (
                            <CTooltip content="Edit">
                              <CButton
                                color="primary"
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(item)}
                              >
                                <CIcon icon={cilPencil} />
                              </CButton>
                            </CTooltip>
                          )}
                          {onDelete && (
                            <CTooltip content="Delete">
                              <CButton
                                color="danger"
                                variant="outline"
                                size="sm"
                                onClick={() => onDelete(item)}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            </CTooltip>
                          )}
                        </div>
                      </CTableDataCell>
                    )}
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="text-muted">
            Showing {paginatedData.length} of {filteredData.length} entries
          </div>
          
          {totalPages > 1 && (
            <CPagination aria-label="Page navigation">
              <CPaginationItem
                aria-label="Previous"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </CPaginationItem>
              
              {(() => {
                // Handle pagination with ellipsis for large number of pages
                const pages = [];
                const maxVisiblePages = 5;
                
                if (totalPages <= maxVisiblePages) {
                  // Show all pages
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(
                      <CPaginationItem
                        key={i}
                        active={currentPage === i}
                        onClick={() => setCurrentPage(i)}
                      >
                        {i}
                      </CPaginationItem>
                    );
                  }
                } else {
                  // Always show first page
                  pages.push(
                    <CPaginationItem
                      key={1}
                      active={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                    >
                      1
                    </CPaginationItem>
                  );
                  
                  // Calculate range of visible pages
                  let startPage = Math.max(2, currentPage - 1);
                  let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 3);
                  
                  if (startPage > 2) {
                    pages.push(<CPaginationItem key="ellipsis1">...</CPaginationItem>);
                  }
                  
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <CPaginationItem
                        key={i}
                        active={currentPage === i}
                        onClick={() => setCurrentPage(i)}
                      >
                        {i}
                      </CPaginationItem>
                    );
                  }
                  
                  if (endPage < totalPages - 1) {
                    pages.push(<CPaginationItem key="ellipsis2">...</CPaginationItem>);
                  }
                  
                  // Always show last page
                  pages.push(
                    <CPaginationItem
                      key={totalPages}
                      active={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </CPaginationItem>
                  );
                }
                
                return pages;
              })()}
              
              <CPaginationItem
                aria-label="Next"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </CPaginationItem>
            </CPagination>
          )}
        </div>
      </CCardBody>
    </CCard>
  );
};

export default ResizableGrid; 