import React, { useState } from 'react';
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
  CPagination,
  CPaginationItem,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilOptions, cilPencil, cilTrash } from '@coreui/icons';

const DataGrid = ({
  title,
  data,
  columns,
  actions = true,
  onEdit,
  onDelete,
  onView,
  searchable = true,
  sortable = true,
  pageSize = 10,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Search functionality
  const filteredData = data.filter((item) =>
    Object.values(item).some(
      (value) =>
        value &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Sorting functionality
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

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
    
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <div className="d-flex justify-content-between align-items-center">
          <strong>{title}</strong>
          <div className="d-flex gap-2">
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
              </CDropdownMenu>
            </CDropdown>
          </div>
        </div>
      </CCardHeader>
      <CCardBody>
        <CTable hover responsive>
          <CTableHead>
            <CTableRow>
              {columns.map((column) => (
                <CTableHeaderCell
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  style={{ cursor: sortable ? 'pointer' : 'default' }}
                >
                  {column.label}
                  {sortConfig.key === column.key && (
                    <span className="ms-1">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </CTableHeaderCell>
              ))}
              {actions && <CTableHeaderCell>Actions</CTableHeaderCell>}
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {paginatedData.map((item, index) => (
              <CTableRow key={index} >
                {columns.map((column) => (
                  <CTableDataCell key={column.key}>
                    {column.render
                      ? column.render(item[column.key], item)
                      : item[column.key]}
                  </CTableDataCell>
                ))}
                {actions && (
                  <CTableDataCell>
                    <div className="d-flex gap-2">
                      {onView && (
                        <CButton
                          color="info"
                          variant="outline"
                          size="sm"
                          onClick={() => onView(item)}
                        >
                          View
                        </CButton>
                      )}
                      {onEdit && (
                        <CButton
                          color="primary"
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(item)}
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                      )}
                      {onDelete && (
                        <CButton
                          color="danger"
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(item)}
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      )}
                    </div>
                  </CTableDataCell>
                )}
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>

        {totalPages > 1 && (
          <CPagination className="justify-content-center mt-3" aria-label="Page navigation">
            <CPaginationItem
              aria-label="Previous"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </CPaginationItem>
            {[...Array(totalPages)].map((_, index) => (
              <CPaginationItem
                key={index + 1}
                active={currentPage === index + 1}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </CPaginationItem>
            ))}
            <CPaginationItem
              aria-label="Next"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </CPaginationItem>
          </CPagination>
        )}
      </CCardBody>
    </CCard>
  );
};

export default DataGrid; 