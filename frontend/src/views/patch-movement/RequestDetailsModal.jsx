import React, { useMemo } from 'react';
import {
    Modal,
    Paper,
    Typography,
    IconButton,
    Stack,
    Grid,
    Box,
    Divider,
    Button,
    CircularProgress
} from '@mui/material';
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
    timelineOppositeContentClasses,
    TimelineOppositeContent,
} from '@mui/lab';
import {
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    HourglassEmpty as HourglassEmptyIcon,
    Block as BlockIcon,
    Download as DownloadIcon,
    Event as EventIcon,
    Person as PersonIcon,
    Schedule as ScheduleIcon,
    Flag as FlagIcon,
    Info as InfoIcon,
    Category as CategoryIcon,
    Computer as ComputerIcon
} from '@mui/icons-material';

// Helper to format dates
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Custom component for neatly displaying a detail item
const DetailItem = ({ label, value }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
        <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
        <Typography variant="body2" color="text.primary" sx={{ textAlign: 'right' }}>{value || 'N/A'}</Typography>
    </Box>
);

// The main modal component
const RequestDetailsModal = ({ request, open, onClose, onUpdateStatus, isTeamLead, loading }) => {
    
    const statusTimeline = useMemo(() => {
        if (!request) return [];
        const timeline = [{ status: 'Pending', date: request.created_at, icon: <HourglassEmptyIcon />, color: 'warning' }];
        if (request.status === 'Approved') timeline.push({ status: 'Approved', date: request.approved_at, icon: <CheckCircleIcon />, color: 'success' });
        else if (request.status === 'Rejected') timeline.push({ status: 'Rejected', date: request.approved_at, icon: <BlockIcon />, color: 'error' });
        else if (request.status === 'On Hold') timeline.push({ status: 'On Hold', date: request.updated_at, icon: <InfoIcon />, color: 'default' });
        return timeline;
    }, [request]);

    if (!request) return null;

    return (
        <Modal open={open} onClose={onClose}>
            <Paper sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90%',
                maxWidth: 900,
                p: 2,
                borderRadius: 2,
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h5" component="h2">Request Details: {request.patch_name}</Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Stack>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
                    <Grid container spacing={4}>
                        {/* Left Column */}
                        <Grid item xs={12} md={6}>
                            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                                <Typography variant="h6" gutterBottom>Request Information</Typography>
                                <Stack spacing={1}>
                                    <DetailItem label="Project" value={request.project_name} />
                                    <DetailItem label="Patch Type" value={request.patch_type} />
                                    <DetailItem label="Severity" value={request.severity} />
                                    <DetailItem label="Environment" value={request.environment_affected} />
                                    <DetailItem label="Est. Deployment" value={`${request.estimated_deployment_time} mins`} />
                                    <DetailItem label="Scheduled Time" value={formatDate(request.scheduled_deployment_time)} />
                                </Stack>
                                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Description</Typography>
                                <Typography variant="body2" sx={{ p: 1, backgroundColor: '#f9f9f9', borderRadius: 1, minHeight: 60 }}>
                                    {request.patch_description || 'No description provided.'}
                                </Typography>
                            </Paper>
                        </Grid>

                        {/* Right Column */}
                        <Grid item xs={12} md={6}>
                            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                                <Typography variant="h6" gutterBottom>People & Timeline</Typography>
                                <Stack spacing={1} mb={2}>
                                    <DetailItem label="Requested By" value={request.requester_name} />
                                    <DetailItem label="Team Lead" value={request.team_lead_name} />
                                    <DetailItem label="Approved/Rejected By" value={request.approved_by_name} />
                                </Stack>
                                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Status Progress</Typography>
                                <Timeline sx={{ p: 0, [`& .${timelineOppositeContentClasses.root}`]: { flex: 0.35 } }}>
                                    {statusTimeline.map((item, index) => (
                                        <TimelineItem key={index}>
                                            <TimelineOppositeContent color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                                {formatDate(item.date)}
                                            </TimelineOppositeContent>
                                            <TimelineSeparator>
                                                <TimelineDot color={item.color}>{item.icon}</TimelineDot>
                                                {index < statusTimeline.length - 1 && <TimelineConnector />}
                                            </TimelineSeparator>
                                            <TimelineContent sx={{ py: '12px', px: 2 }}>
                                                <Typography variant="subtitle1" component="span">{item.status}</Typography>
                                            </TimelineContent>
                                        </TimelineItem>
                                    ))}
                                </Timeline>
                                {request.attached_document && (
                                    <Button variant="outlined" startIcon={<DownloadIcon />} href={`/path/to/docs/${request.attached_document}`} target="_blank" sx={{ mt: 2 }}>
                                        Download Attachment
                                    </Button>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
                
                <Divider sx={{ mt: 2 }} />
                <Stack direction="row" justifyContent="flex-end" spacing={2} mt={2}>
                    {isTeamLead && request.status === 'Pending' && (
                        <>
                            <Button variant="contained" color="success" onClick={() => onUpdateStatus(request.patch_id, 'Approved')} disabled={loading}>
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Approve'}
                            </Button>
                            <Button variant="contained" color="error" onClick={() => onUpdateStatus(request.patch_id, 'Rejected')} disabled={loading}>
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Reject'}
                            </Button>
                            <Button variant="outlined" color="secondary" onClick={() => onUpdateStatus(request.patch_id, 'On Hold')} disabled={loading}>
                                On Hold
                            </Button>
                        </>
                    )}
                    <Button onClick={onClose} color="inherit">Close</Button>
                </Stack>
            </Paper>
        </Modal>
    );
};

export default RequestDetailsModal;
