    import React, { useMemo } from 'react';
    import {
        CModal,
        CModalHeader,
        CModalTitle,
        CModalBody,
        CModalFooter,
        CButton,
        CListGroup,
        CListGroupItem,
        CBadge,
        CRow,
        CCol
    } from '@coreui/react';
    import Button from '@mui/material/Button';
    import Timeline from '@mui/lab/Timeline';
    import TimelineItem from '@mui/lab/TimelineItem';
    import TimelineSeparator from '@mui/lab/TimelineSeparator';
    import TimelineConnector from '@mui/lab/TimelineConnector';
    import TimelineContent from '@mui/lab/TimelineContent';
    import TimelineDot from '@mui/lab/TimelineDot';
    import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
    import Typography from '@mui/material/Typography';
    import CheckCircleIcon from '@mui/icons-material/CheckCircle';
    import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';


    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const TrackEntryDetailsModal = ({ visible, onClose, entry }) => {
        const statusTimeline = useMemo(() => {
            if (!entry) return [];
            
            const statuses = ['To Do', 'In Progress', 'Done'];
            const currentStatus = entry.status || 'To Do';
            const currentIndex = statuses.indexOf(currentStatus);
            
            return statuses.map((status, index) => ({
                status,
                active: index <= currentIndex,
                completed: index < currentIndex,
                current: index === currentIndex,
                date: index === 0 
                    ? formatDate(entry.created_at) 
                    : index <= currentIndex 
                        ? formatDate(entry.updated_at || new Date().toISOString())
                        : ''
            }));
        }, [entry]);

        if (!entry) return null;

        const isCustomerEntry = 'customer_track_entry_id' in entry;
        const entryId = isCustomerEntry ? entry.customer_track_entry_id : entry.track_entry_id;
        const entryType = isCustomerEntry ? 'Customer Task' : 'Internal Task';

        const getStatusBadgeColor = (status) => {
            switch (status) {
                case 'To Do':
                    return 'secondary';
                case 'In Progress':
                    return 'primary';
                case 'Blocked':
                    return 'danger';
                case 'Done':
                    return 'success';
                default:
                    return 'light';
            }
        };

        const getPriorityBadgeColor = (priority) => {
            switch (priority) {
                case 'Low':
                    return 'info';
                case 'Medium':
                    return 'warning';
                case 'High':
                case 'Critical':
                    return 'danger';
                default:
                    return 'light';
            }
        };



        return (
            <CModal size="lg" visible={visible} onClose={onClose} backdrop={true}>
                <CModalHeader onDismiss={onClose}>
                    <CModalTitle>Task Details: {entry.title}</CModalTitle>
                </CModalHeader>
                <CModalBody>
                    <CRow className="mb-3">
                        <CCol md={6}>
                            <h6 className="text-muted">Task Information</h6>
                            <CListGroup>
                                <CListGroupItem>
                                    <strong>Type:</strong> {entryType}
                                </CListGroupItem>
                                <CListGroupItem>
                                    <div className="d-flex flex-column">
                                        <strong>Status Progress</strong>
                                        <Timeline position="alternate" sx={{ mt: 2, p: 0 }}>
                                            {statusTimeline.map((item, index) => (
                                                <TimelineItem key={item.status}>
                                                    <TimelineOppositeContent
                                                        sx={{ m: 'auto 0', px: 1 }}
                                                        align="right"
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        {item.date}
                                                    </TimelineOppositeContent>
                                                    <TimelineSeparator>
                                                        {item.completed ? (
                                                            <TimelineDot color="success">
                                                                <CheckCircleIcon fontSize="small" />
                                                            </TimelineDot>
                                                        ) : (
                                                            <TimelineDot color={item.current ? 'primary' : 'grey'}>
                                                                <RadioButtonUncheckedIcon fontSize="small" />
                                                            </TimelineDot>
                                                        )}
                                                        {index < statusTimeline.length - 1 && (
                                                            <TimelineConnector />
                                                        )}
                                                    </TimelineSeparator>
                                                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                                                        <Typography 
                                                            variant="body1" 
                                                            component="span"
                                                            sx={{ 
                                                                fontWeight: item.current ? 'bold' : 'normal',
                                                                color: item.current ? 'primary.main' : 'inherit'
                                                            }}
                                                        >
                                                            {item.status}
                                                        </Typography>
                                                    </TimelineContent>
                                                </TimelineItem>
                                            ))}
                                        </Timeline>
                                    </div>
                                </CListGroupItem>
                                <CListGroupItem>
                                    <strong>Priority:</strong>{' '}
                                    <CBadge color={getPriorityBadgeColor(entry.priority)} className="ms-2">
                                        {entry.priority}
                                    </CBadge>
                                </CListGroupItem>
                                <CListGroupItem>
                                    <strong>Task Type:</strong> {entry.task_type || 'N/A'}
                                </CListGroupItem>
                                <CListGroupItem>
                                    <strong>Due Date:</strong> {formatDate(entry.due_date)}
                                </CListGroupItem>
                                <CListGroupItem>
                                    <strong>Created At:</strong> {formatDate(entry.created_at)}
                                </CListGroupItem>
                                {entry.updated_at && entry.updated_at !== entry.created_at && (
                                    <CListGroupItem>
                                        <strong>Last Updated:</strong> {formatDate(entry.updated_at)}
                                    </CListGroupItem>
                                )}
                            </CListGroup>
                        </CCol>
                        <CCol md={6}>
                            <h6 className="text-muted">Assignment</h6>
                            <CListGroup>
                                <CListGroupItem>
                                    <strong>Project:</strong> {entry.project_name || 'N/A'}
                                </CListGroupItem>
                                {entry.team_name && (
                                    <CListGroupItem>
                                        <strong>Team:</strong> {entry.team_name}
                                    </CListGroupItem>
                                )}
                                <CListGroupItem>
                                    <strong>Assigned To:</strong> {entry.employee_name || entry.assigned_to_name || 'N/A'}
                                </CListGroupItem>
                                <CListGroupItem>
                                    <strong>Assigned By:</strong> {entry.assigned_by_name || 'N/A'}
                                </CListGroupItem>
                                {entry.customer_company_name && (
                                    <CListGroupItem>
                                        <strong>Customer Company:</strong> {entry.customer_company_name}
                                    </CListGroupItem>
                                )}
                            </CListGroup>
                        </CCol>
                    </CRow>

                    <div className="mt-3">
                        <h6 className="text-muted">Description</h6>
                        <div className="p-3 bg-light rounded">
                            {entry.description || 'No description provided.'}
                        </div>
                    </div>

                    {entry.notes && (
                        <div className="mt-3">
                            <h6 className="text-muted">Notes</h6>
                            <div className="p-3 bg-light rounded">
                                {entry.notes}
                            </div>
                        </div>
                    )}
                </CModalBody>
                <CModalFooter>
                    <Button
                        variant="contained"
                        sx={{ backgroundColor: 'black', color: 'white', textTransform: 'none' }}
                        color="secondary"
                        onClick={onClose}
                    >Close</Button>
                </CModalFooter>
            </CModal>
        );
    };

    export default TrackEntryDetailsModal;
