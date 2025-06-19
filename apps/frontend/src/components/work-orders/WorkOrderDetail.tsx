import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Avatar,
  Paper,
  IconButton,
  Tooltip,
  Collapse,
  FormHelperText,
} from '@mui/material';
import {
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  Comment as CommentIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Build as BuildIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PictureAsPdf as PdfIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  AccessTime as TimeIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import axios from 'axios';
import AttachmentManager from './AttachmentManager';

// Configure axios base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Types matching backend
export enum WorkOrderStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
}

export enum WorkOrderPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum WorkOrderType {
  MAINTENANCE = 'maintenance',
  REPAIR = 'repair',
  INSPECTION = 'inspection',
  INSTALLATION = 'installation',
  EMERGENCY = 'emergency',
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface WorkOrder {
  id: string;
  workOrderNumber: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  type: WorkOrderType;
  estimatedHours?: number;
  actualHours?: number;
  estimatedCost?: number;
  actualCost?: number;
  scheduledStartDate?: Date;
  scheduledEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  completionNotes?: string;
  signature?: string;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: User;
  assignedToId?: string;
  asset?: any;
  comments: Comment[];
  attachments: any[];
  timeEntries?: TimeEntry[];
  isOverdue: boolean;
  daysOverdue: number;
  customer?: any;
  totalTimeEntries?: number;
  totalTimeCost?: number;
}

interface Comment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  author: User;
}

interface TimeEntry {
  id: string;
  timeEntryType: 'travel_time' | 'straight_time' | 'overtime' | 'double_time';
  hours: number;
  rate: number;
  totalAmount: number;
  description?: string;
  date: Date;
  technician: User;
}

interface WorkOrderDetailProps {
  workOrderId: string;
  open: boolean;
  onClose: () => void;
  onUpdate?: (workOrder: WorkOrder) => void;
}

const statusColors: Record<WorkOrderStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  [WorkOrderStatus.OPEN]: 'info',
  [WorkOrderStatus.IN_PROGRESS]: 'primary',
  [WorkOrderStatus.PENDING]: 'warning',
  [WorkOrderStatus.COMPLETED]: 'success',
  [WorkOrderStatus.CANCELLED]: 'error',
  [WorkOrderStatus.CLOSED]: 'default',
};

const priorityColors: Record<WorkOrderPriority, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  [WorkOrderPriority.LOW]: 'default',
  [WorkOrderPriority.MEDIUM]: 'info',
  [WorkOrderPriority.HIGH]: 'warning',
  [WorkOrderPriority.CRITICAL]: 'error',
};

export function WorkOrderDetail({ workOrderId, open, onClose, onUpdate }: WorkOrderDetailProps) {
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [editingCosts, setEditingCosts] = useState(false);
  const [newStatus, setNewStatus] = useState<WorkOrderStatus>(WorkOrderStatus.OPEN);
  const [completionNotes, setCompletionNotes] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [editingTimeEntries, setEditingTimeEntries] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [editingTimeEntryId, setEditingTimeEntryId] = useState<string | null>(null);
  const [editTimeEntry, setEditTimeEntry] = useState({
    timeEntryType: 'straight_time' as 'travel_time' | 'straight_time' | 'overtime' | 'double_time',
    hours: 0,
    description: '',
    date: new Date(),
    technicianId: '',
  });
  const [newTimeEntry, setNewTimeEntry] = useState({
    timeEntryType: 'straight_time' as const,
    hours: 0,
    description: '',
    date: new Date(),
    technicianId: '',
  });
  
  // Edit form states
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: WorkOrderPriority.MEDIUM,
    type: WorkOrderType.MAINTENANCE,
    estimatedHours: 0,
    actualHours: 0,
    estimatedCost: 0,
    actualCost: 0,
    scheduledStartDate: null as Date | null,
    scheduledEndDate: null as Date | null,
    actualStartDate: null as Date | null,
    actualEndDate: null as Date | null,
  });

  // Fetch work order details
  useEffect(() => {
    if (open && workOrderId) {
      fetchWorkOrder();
      fetchUsers();
      fetchTimeEntries();
    }
  }, [open, workOrderId]);

  const fetchWorkOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/work-orders/${workOrderId}`);
      setWorkOrder(response.data);
      setNewStatus(response.data.status);
      
      // Don't set selectedTechnician here - wait for users to load first
      // This prevents the MUI SelectInput error
      
      // Initialize edit form
      setEditForm({
        title: response.data.title,
        description: response.data.description,
        priority: response.data.priority,
        type: response.data.type,
        estimatedHours: response.data.estimatedHours || 0,
        actualHours: response.data.actualHours || 0,
        estimatedCost: response.data.estimatedCost || 0,
        actualCost: response.data.actualCost || 0,
        scheduledStartDate: response.data.scheduledStartDate ? new Date(response.data.scheduledStartDate) : null,
        scheduledEndDate: response.data.scheduledEndDate ? new Date(response.data.scheduledEndDate) : null,
        actualStartDate: response.data.actualStartDate ? new Date(response.data.actualStartDate) : null,
        actualEndDate: response.data.actualEndDate ? new Date(response.data.actualEndDate) : null,
      });
    } catch (err) {
      setError('Failed to load work order');
      console.error('Error fetching work order:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users');
      setUsers(response.data);
      
      // Now set selectedTechnician after users are loaded
      if (workOrder?.assignedToId && response.data.length > 0) {
        const assignedUser = response.data.find((user: User) => user.id === workOrder.assignedToId);
        setSelectedTechnician(assignedUser ? workOrder.assignedToId : '');
      } else if (workOrder?.assignedToId) {
        // If the assigned user is not in the users list, clear the selection
        setSelectedTechnician('');
      } else {
        setSelectedTechnician('');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      // If users fail to load, clear selectedTechnician to prevent MUI Select errors
      setSelectedTechnician('');
    }
  };

  const fetchTimeEntries = async () => {
    try {
      const response = await api.get(`/api/work-orders/${workOrderId}/time-entries`);
      setTimeEntries(response.data);
    } catch (err) {
      console.error('Error fetching time entries:', err);
    }
  };

  const handleStatusUpdate = async () => {
    if (!workOrder) return;

    try {
      setLoading(true);
      const response = await api.put(`/api/work-orders/${workOrder.id}/status`, {
        status: newStatus,
        completionNotes: newStatus === WorkOrderStatus.COMPLETED ? completionNotes : undefined,
      });
      
      setWorkOrder(response.data);
      setEditingStatus(false);
      setCompletionNotes('');
      if (onUpdate) onUpdate(response.data);
    } catch (err) {
      setError('Failed to update status');
      console.error('Error updating status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentUpdate = async () => {
    if (!workOrder) return;

    try {
      setLoading(true);
      const response = await api.put(`/api/work-orders/${workOrder.id}`, {
        assignedToId: selectedTechnician || null,
      });
      
      setWorkOrder(response.data);
      setEditingAssignment(false);
      if (onUpdate) onUpdate(response.data);
    } catch (err) {
      setError('Failed to update assignment');
      console.error('Error updating assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!workOrder || !newComment.trim()) return;

    try {
      setLoading(true);
      const response = await api.post(`/api/work-orders/${workOrder.id}/comments`, {
        content: newComment,
        isInternal: isInternalComment,
      });
      
      setWorkOrder(prev => prev ? {
        ...prev,
        comments: [...prev.comments, response.data]
      } : null);
      setAddingComment(false);
      setNewComment('');
      setIsInternalComment(false);
      if (onUpdate) onUpdate(workOrder);
    } catch (err) {
      setError('Failed to add comment');
      console.error('Error adding comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsUpdate = async () => {
    if (!workOrder) return;

    try {
      setLoading(true);
      const response = await api.put(`/api/work-orders/${workOrder.id}`, {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        type: editForm.type,
      });
      
      setWorkOrder(response.data);
      setEditingDetails(false);
      if (onUpdate) onUpdate(response.data);
    } catch (err) {
      setError('Failed to update details');
      console.error('Error updating details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleUpdate = async () => {
    if (!workOrder) return;

    try {
      setLoading(true);
      const response = await api.put(`/api/work-orders/${workOrder.id}`, {
        scheduledStartDate: editForm.scheduledStartDate,
        scheduledEndDate: editForm.scheduledEndDate,
        actualStartDate: editForm.actualStartDate,
        actualEndDate: editForm.actualEndDate,
      });
      
      setWorkOrder(response.data);
      setEditingSchedule(false);
      if (onUpdate) onUpdate(response.data);
    } catch (err) {
      setError('Failed to update schedule');
      console.error('Error updating schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCostsUpdate = async () => {
    if (!workOrder) return;

    try {
      setLoading(true);
      const response = await api.put(`/api/work-orders/${workOrder.id}`, {
        estimatedHours: editForm.estimatedHours,
        actualHours: editForm.actualHours,
        estimatedCost: editForm.estimatedCost,
        actualCost: editForm.actualCost,
      });
      
      setWorkOrder(response.data);
      setEditingCosts(false);
      if (onUpdate) onUpdate(response.data);
    } catch (err) {
      setError('Failed to update costs');
      console.error('Error updating costs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!workOrder) return;

    try {
      setGeneratingReport(true);
      const response = await api.get(`/api/reports/work-order/${workOrder.id}/pdf`, {
        responseType: 'blob',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `work-order-${workOrder.workOrderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to generate report');
      console.error('Error generating report:', err);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleAddTimeEntry = async () => {
    if (!workOrder || newTimeEntry.hours <= 0) return;

    try {
      setLoading(true);
      const response = await api.post(`/api/work-orders/${workOrder.id}/time-entries`, {
        timeEntryType: newTimeEntry.timeEntryType,
        hours: newTimeEntry.hours,
        description: newTimeEntry.description,
        date: newTimeEntry.date,
        technicianId: newTimeEntry.technicianId || undefined,
      });
      
      setTimeEntries(prev => [...prev, response.data]);
      setNewTimeEntry({
        timeEntryType: 'straight_time',
        hours: 0,
        description: '',
        date: new Date(),
        technicianId: '',
      });
      setEditingTimeEntries(false);
      
      // Refresh work order to get updated totals
      await fetchWorkOrder();
    } catch (err) {
      setError('Failed to add time entry');
      console.error('Error adding time entry:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTimeEntry = async (timeEntryId: string) => {
    try {
      setLoading(true);
      await api.delete(`/api/work-orders/time-entries/${timeEntryId}`);
      setTimeEntries(prev => prev.filter(entry => entry.id !== timeEntryId));
      
      // Refresh work order to get updated totals
      await fetchWorkOrder();
    } catch (err) {
      setError('Failed to delete time entry');
      console.error('Error deleting time entry:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEditTimeEntry = (timeEntry: TimeEntry) => {
    setEditingTimeEntryId(timeEntry.id);
    setEditTimeEntry({
      timeEntryType: timeEntry.timeEntryType,
      hours: timeEntry.hours,
      description: timeEntry.description || '',
      date: new Date(timeEntry.date),
      technicianId: timeEntry.technician.id,
    });
  };

  const handleUpdateTimeEntry = async () => {
    if (!editingTimeEntryId || editTimeEntry.hours <= 0) return;

    try {
      setLoading(true);
      const response = await api.put(`/api/work-orders/time-entries/${editingTimeEntryId}`, {
        timeEntryType: editTimeEntry.timeEntryType,
        hours: editTimeEntry.hours,
        description: editTimeEntry.description,
        date: editTimeEntry.date,
        technicianId: editTimeEntry.technicianId,
      });
      
      setTimeEntries(prev => prev.map(entry => 
        entry.id === editingTimeEntryId ? response.data : entry
      ));
      setEditingTimeEntryId(null);
      setEditTimeEntry({
        timeEntryType: 'straight_time',
        hours: 0,
        description: '',
        date: new Date(),
        technicianId: '',
      });
      
      // Refresh work order to get updated totals
      await fetchWorkOrder();
    } catch (err) {
      setError('Failed to update time entry');
      console.error('Error updating time entry:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelEditTimeEntry = () => {
    setEditingTimeEntryId(null);
    setEditTimeEntry({
      timeEntryType: 'straight_time',
      hours: 0,
      description: '',
      date: new Date(),
      technicianId: '',
    });
  };

  const formatDateTime = (date: Date | undefined) => {
    if (!date) return 'Not set';
    return dayjs(date).format('MMM DD, YYYY HH:mm');
  };

  const formatDuration = (hours: number | undefined) => {
    if (!hours) return 'Not set';
    return `${hours} hours`;
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return 'Not set';
    return `$${amount.toFixed(2)}`;
  };

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {workOrder ? `Work Order #${workOrder.workOrderNumber}` : 'Loading...'}
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            startIcon={generatingReport ? <PdfIcon /> : <PdfIcon />}
            onClick={handleGenerateReport}
            disabled={generatingReport}
            size="small"
            color="secondary"
          >
            {generatingReport ? 'Generating...' : 'Generate Report'}
          </Button>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading && (
          <Box p={3}>
            <Typography>Loading work order details...</Typography>
          </Box>
        )}

        {error && (
          <Box p={3}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {workOrder && (
          <Box>
            {/* Header Section */}
            <Box p={3} bgcolor="grey.50">
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    {workOrder.title}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      label={workOrder.status.replace('_', ' ').toUpperCase()}
                      color={statusColors[workOrder.status]}
                      size="small"
                    />
                    <Chip
                      label={workOrder.priority.toUpperCase()}
                      color={priorityColors[workOrder.priority]}
                      size="small"
                    />
                    <Chip
                      label={workOrder.type.toUpperCase()}
                      variant="outlined"
                      size="small"
                    />
                    {workOrder.isOverdue && (
                      <Chip
                        label={`OVERDUE (${workOrder.daysOverdue} days)`}
                        color="error"
                        size="small"
                      />
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box display="flex" gap={1} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => setEditingStatus(true)}
                      size="small"
                    >
                      Update Status
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<AssignmentIcon />}
                      onClick={() => setEditingAssignment(true)}
                      size="small"
                    >
                      Assign
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CommentIcon />}
                      onClick={() => setAddingComment(true)}
                      size="small"
                    >
                      Add Comment
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Box p={3}>
              <Grid container spacing={3}>
                {/* Main Details */}
                <Grid item xs={12} md={8}>
                  {/* Work Order Details Section */}
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">
                          Work Order Details
                        </Typography>
                        <IconButton 
                          onClick={() => setEditingDetails(!editingDetails)}
                          size="small"
                        >
                          {editingDetails ? <CancelIcon /> : <EditIcon />}
                        </IconButton>
                      </Box>
                      
                      <Collapse in={!editingDetails}>
                        <Typography variant="body1" paragraph>
                          {workOrder.description}
                        </Typography>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Assigned To
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                              <PersonIcon fontSize="small" />
                              <Typography>
                                {workOrder.assignedTo 
                                  ? `${workOrder.assignedTo.firstName} ${workOrder.assignedTo.lastName}`
                                  : 'Unassigned'
                                }
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Created
                            </Typography>
                            <Typography>{formatDateTime(workOrder.createdAt)}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Last Updated
                            </Typography>
                            <Typography>{formatDateTime(workOrder.updatedAt)}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Total Time
                            </Typography>
                            <Typography>{formatDuration(workOrder.totalTimeEntries || workOrder.actualHours)}</Typography>
                          </Grid>
                        </Grid>

                        {workOrder.completionNotes && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Completion Notes
                            </Typography>
                            <Typography variant="body2">
                              {workOrder.completionNotes}
                            </Typography>
                          </>
                        )}
                      </Collapse>

                      <Collapse in={editingDetails}>
                        <Box>
                          <TextField
                            fullWidth
                            label="Title"
                            value={editForm.title}
                            onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                            margin="normal"
                          />
                          <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Description"
                            value={editForm.description}
                            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            margin="normal"
                          />
                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={6}>
                              <FormControl fullWidth>
                                <InputLabel>Priority</InputLabel>
                                <Select
                                  value={editForm.priority}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value as WorkOrderPriority }))}
                                  label="Priority"
                                >
                                  {Object.values(WorkOrderPriority).map((priority) => (
                                    <MenuItem key={priority} value={priority}>
                                      {priority.toUpperCase()}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                              <FormControl fullWidth>
                                <InputLabel>Type</InputLabel>
                                <Select
                                  value={editForm.type}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value as WorkOrderType }))}
                                  label="Type"
                                >
                                  {Object.values(WorkOrderType).map((type) => (
                                    <MenuItem key={type} value={type}>
                                      {type.toUpperCase()}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                              <FormControl fullWidth>
                                <InputLabel>Assign To</InputLabel>
                                <Select
                                  value={selectedTechnician}
                                  onChange={(e) => setSelectedTechnician(e.target.value)}
                                  label="Assign To"
                                  disabled={users.length === 0}
                                >
                                  <MenuItem value="">
                                    <em>Unassigned</em>
                                  </MenuItem>
                                  {users.filter(user => user.role === 'technician').map(user => (
                                    <MenuItem key={user.id} value={user.id}>
                                      {user.firstName} {user.lastName} ({user.email})
                                    </MenuItem>
                                  ))}
                                </Select>
                                {users.length === 0 && (
                                  <FormHelperText>Loading users...</FormHelperText>
                                )}
                              </FormControl>
                            </Grid>
                          </Grid>
                          <Box display="flex" gap={1} sx={{ mt: 2 }}>
                            <Button
                              variant="contained"
                              onClick={handleDetailsUpdate}
                              disabled={loading}
                              startIcon={<SaveIcon />}
                            >
                              {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => setEditingDetails(false)}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </Box>
                      </Collapse>
                    </CardContent>
                  </Card>

                  {/* Comments Section */}
                  <Card sx={{ mt: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">
                          <CommentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Comments ({workOrder.comments.length})
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<CommentIcon />}
                          onClick={() => setAddingComment(true)}
                          size="small"
                        >
                          Add Comment
                        </Button>
                      </Box>
                      
                      {workOrder.comments.length === 0 ? (
                        <Typography color="text.secondary" textAlign="center" py={2}>
                          No comments yet. Be the first to add one!
                        </Typography>
                      ) : (
                        <List>
                          {workOrder.comments.map((comment) => (
                            <ListItem key={comment.id} sx={{ px: 0 }}>
                              <ListItemText
                                primary={
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="subtitle2">
                                      {comment.author.firstName} {comment.author.lastName}
                                    </Typography>
                                    <Chip
                                      label={comment.isInternal ? 'Internal' : 'Public'}
                                      size="small"
                                      color={comment.isInternal ? 'warning' : 'default'}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                      {formatDateTime(comment.createdAt)}
                                    </Typography>
                                  </Box>
                                }
                                secondary={comment.content}
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </CardContent>
                  </Card>

                  {/* Time Entries Section */}
                  <Card sx={{ mt: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">
                          <TimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Time Entries ({timeEntries.length})
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => setEditingTimeEntries(true)}
                          size="small"
                        >
                          Add Time Entry
                        </Button>
                      </Box>
                      
                      <Collapse in={editingTimeEntries}>
                        <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Add New Time Entry
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <FormControl fullWidth>
                                <InputLabel>Time Type</InputLabel>
                                <Select
                                  value={newTimeEntry.timeEntryType}
                                  onChange={(e) => setNewTimeEntry(prev => ({ ...prev, timeEntryType: e.target.value as any }))}
                                  label="Time Type"
                                >
                                  <MenuItem value="travel_time">Travel Time</MenuItem>
                                  <MenuItem value="straight_time">Straight Time</MenuItem>
                                  <MenuItem value="overtime">Overtime</MenuItem>
                                  <MenuItem value="double_time">Double Time</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                fullWidth
                                type="number"
                                label="Hours"
                                value={newTimeEntry.hours}
                                onChange={(e) => setNewTimeEntry(prev => ({ ...prev, hours: parseFloat(e.target.value) || 0 }))}
                                inputProps={{ min: 0, max: 24, step: 0.25 }}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Description (Optional)"
                                value={newTimeEntry.description}
                                onChange={(e) => setNewTimeEntry(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe the work performed..."
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <DateTimePicker
                                label="Date"
                                value={dayjs(newTimeEntry.date)}
                                onChange={(date) => setNewTimeEntry(prev => ({ ...prev, date: date?.toDate() || new Date() }))}
                                slotProps={{ textField: { fullWidth: true } }}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <FormControl fullWidth margin="normal" size="small">
                                <InputLabel>Technician</InputLabel>
                                <Select
                                  value={newTimeEntry.technicianId}
                                  onChange={e => setNewTimeEntry(prev => ({ ...prev, technicianId: e.target.value }))}
                                  label="Technician"
                                  disabled={users.length === 0}
                                >
                                  <MenuItem value="">
                                    <em>Select Technician</em>
                                  </MenuItem>
                                  {users.filter(user => user.role === 'technician').map(user => (
                                    <MenuItem key={user.id} value={user.id}>
                                      {user.firstName} {user.lastName} ({user.email})
                                    </MenuItem>
                                  ))}
                                </Select>
                                {users.length === 0 && <FormHelperText>Loading users...</FormHelperText>}
                              </FormControl>
                            </Grid>
                          </Grid>
                          <Box display="flex" gap={1} sx={{ mt: 2 }}>
                            <Button
                              variant="contained"
                              onClick={handleAddTimeEntry}
                              disabled={loading || newTimeEntry.hours <= 0}
                              startIcon={<SaveIcon />}
                            >
                              {loading ? 'Adding...' : 'Add Time Entry'}
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => setEditingTimeEntries(false)}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </Box>
                      </Collapse>
                      
                      {timeEntries.length === 0 ? (
                        <Typography color="text.secondary" textAlign="center" py={2}>
                          No time entries yet. Add your first time entry!
                        </Typography>
                      ) : (
                        <List>
                          {timeEntries.map((timeEntry) => (
                            <ListItem key={timeEntry.id} sx={{ px: 0 }}>
                              {editingTimeEntryId === timeEntry.id ? (
                                // Edit mode
                                <Box sx={{ width: '100%' }}>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} sm={3}>
                                      <FormControl fullWidth size="small">
                                        <InputLabel>Type</InputLabel>
                                        <Select
                                          value={editTimeEntry.timeEntryType}
                                          onChange={(e) => setEditTimeEntry(prev => ({ ...prev, timeEntryType: e.target.value as any }))}
                                          label="Type"
                                        >
                                          <MenuItem value="travel_time">Travel Time</MenuItem>
                                          <MenuItem value="straight_time">Straight Time</MenuItem>
                                          <MenuItem value="overtime">Overtime</MenuItem>
                                          <MenuItem value="double_time">Double Time</MenuItem>
                                        </Select>
                                      </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={2}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        label="Hours"
                                        type="number"
                                        value={editTimeEntry.hours}
                                        onChange={(e) => setEditTimeEntry(prev => ({ ...prev, hours: Number(e.target.value) }))}
                                        inputProps={{ min: 0, step: 0.25 }}
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                      <FormControl fullWidth size="small">
                                        <InputLabel>Technician</InputLabel>
                                        <Select
                                          value={editTimeEntry.technicianId}
                                          onChange={(e) => setEditTimeEntry(prev => ({ ...prev, technicianId: e.target.value }))}
                                          label="Technician"
                                        >
                                          {users.filter(user => user.role === 'technician').map(user => (
                                            <MenuItem key={user.id} value={user.id}>
                                              {user.firstName} {user.lastName}
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        label="Description"
                                        value={editTimeEntry.description}
                                        onChange={(e) => setEditTimeEntry(prev => ({ ...prev, description: e.target.value }))}
                                      />
                                    </Grid>
                                  </Grid>
                                  <Box display="flex" gap={1} sx={{ mt: 1 }}>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      onClick={handleUpdateTimeEntry}
                                      disabled={loading || editTimeEntry.hours <= 0}
                                    >
                                      {loading ? 'Updating...' : 'Update'}
                                    </Button>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      onClick={cancelEditTimeEntry}
                                    >
                                      Cancel
                                    </Button>
                                  </Box>
                                </Box>
                              ) : (
                                // Display mode
                                <>
                                  <ListItemText
                                    primary={
                                      <Box display="flex" alignItems="center" gap={1}>
                                        <Typography variant="subtitle2">
                                          {timeEntry.technician.firstName} {timeEntry.technician.lastName}
                                        </Typography>
                                        <Chip
                                          label={timeEntry.timeEntryType.replace('_', ' ').toUpperCase()}
                                          size="small"
                                          color="primary"
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                          {formatDateTime(timeEntry.date)}
                                        </Typography>
                                      </Box>
                                    }
                                    secondary={
                                      <Box>
                                        <Box component="span" sx={{ fontSize: '0.875rem', lineHeight: 1.43, display: 'block' }}>
                                          {timeEntry.hours} hours @ ${timeEntry.rate}/hr = ${timeEntry.totalAmount.toFixed(2)}
                                        </Box>
                                        {timeEntry.description && (
                                          <Box component="span" sx={{ fontSize: '0.875rem', lineHeight: 1.43, color: 'text.secondary', display: 'block' }}>
                                            {timeEntry.description}
                                          </Box>
                                        )}
                                      </Box>
                                    }
                                    componentsProps={{
                                      secondary: {
                                        component: 'div'
                                      }
                                    }}
                                  />
                                  <Box>
                                    <IconButton
                                      size="small"
                                      onClick={() => startEditTimeEntry(timeEntry)}
                                      sx={{ mr: 1 }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteTimeEntry(timeEntry.id)}
                                      color="error"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </>
                              )}
                            </ListItem>
                          ))}
                        </List>
                      )}
                      
                      {timeEntries.length > 0 && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                          <Typography variant="subtitle2" color="white">
                            Total Time: {timeEntries.reduce((sum, entry) => sum + entry.hours, 0).toFixed(2)} hours
                          </Typography>
                          <Typography variant="subtitle2" color="white">
                            Total Cost: ${timeEntries.reduce((sum, entry) => sum + entry.totalAmount, 0).toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>

                  {/* Attachments Section */}
                  <Card sx={{ mt: 2 }}>
                    <CardContent>
                      <AttachmentManager
                        workOrderId={workOrder.id}
                        attachments={workOrder.attachments || []}
                        onAttachmentAdded={(attachment) => {
                          setWorkOrder(prev => prev ? {
                            ...prev,
                            attachments: [...(prev.attachments || []), attachment]
                          } : null);
                        }}
                        onAttachmentDeleted={(attachmentId) => {
                          setWorkOrder(prev => prev ? {
                            ...prev,
                            attachments: (prev.attachments || []).filter(a => a.id !== attachmentId)
                          } : null);
                        }}
                        canUpload={true}
                        canDelete={true}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Side Panel */}
                <Grid item xs={12} md={4}>
                  {/* Schedule & Time Tracking */}
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">
                          <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Schedule & Time
                        </Typography>
                        <IconButton 
                          onClick={() => setEditingSchedule(!editingSchedule)}
                          size="small"
                        >
                          {editingSchedule ? <CancelIcon /> : <EditIcon />}
                        </IconButton>
                      </Box>
                      
                      <Collapse in={!editingSchedule}>
                        <Grid container spacing={1}>
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                              Scheduled Start
                            </Typography>
                            <Typography variant="body2">
                              {formatDateTime(workOrder.scheduledStartDate)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                              Scheduled End
                            </Typography>
                            <Typography variant="body2">
                              {formatDateTime(workOrder.scheduledEndDate)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                              Actual Start
                            </Typography>
                            <Typography variant="body2">
                              {formatDateTime(workOrder.actualStartDate)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                              Actual End
                            </Typography>
                            <Typography variant="body2">
                              {formatDateTime(workOrder.actualEndDate)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Collapse>

                      <Collapse in={editingSchedule}>
                        <Box>
                          <DateTimePicker
                            label="Scheduled Start"
                            value={editForm.scheduledStartDate ? dayjs(editForm.scheduledStartDate) : null}
                            onChange={(date) => setEditForm(prev => ({ ...prev, scheduledStartDate: date?.toDate() || null }))}
                            slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                          />
                          <DateTimePicker
                            label="Scheduled End"
                            value={editForm.scheduledEndDate ? dayjs(editForm.scheduledEndDate) : null}
                            onChange={(date) => setEditForm(prev => ({ ...prev, scheduledEndDate: date?.toDate() || null }))}
                            slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                          />
                          <DateTimePicker
                            label="Actual Start"
                            value={editForm.actualStartDate ? dayjs(editForm.actualStartDate) : null}
                            onChange={(date) => setEditForm(prev => ({ ...prev, actualStartDate: date?.toDate() || null }))}
                            slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                          />
                          <DateTimePicker
                            label="Actual End"
                            value={editForm.actualEndDate ? dayjs(editForm.actualEndDate) : null}
                            onChange={(date) => setEditForm(prev => ({ ...prev, actualEndDate: date?.toDate() || null }))}
                            slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                          />
                          <Box display="flex" gap={1} sx={{ mt: 2 }}>
                            <Button
                              variant="contained"
                              onClick={handleScheduleUpdate}
                              disabled={loading}
                              startIcon={<SaveIcon />}
                            >
                              {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => setEditingSchedule(false)}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </Box>
                      </Collapse>
                    </CardContent>
                  </Card>

                  {/* Estimates & Costs */}
                  <Card sx={{ mt: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">
                          <MoneyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Estimates & Costs
                        </Typography>
                        <IconButton 
                          onClick={() => setEditingCosts(!editingCosts)}
                          size="small"
                        >
                          {editingCosts ? <CancelIcon /> : <EditIcon />}
                        </IconButton>
                      </Box>
                      
                      <Collapse in={!editingCosts}>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Est. Hours
                            </Typography>
                            <Typography variant="body2">
                              {formatDuration(workOrder.estimatedHours)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Actual Hours
                            </Typography>
                            <Typography variant="body2">
                              {formatDuration(workOrder.actualHours)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Est. Cost
                            </Typography>
                            <Typography variant="body2">
                              {formatCurrency(workOrder.estimatedCost)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Actual Cost
                            </Typography>
                            <Typography variant="body2">
                              {formatCurrency(workOrder.actualCost)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Collapse>

                      <Collapse in={editingCosts}>
                        <Box>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <TextField
                                fullWidth
                                type="number"
                                label="Est. Hours"
                                value={editForm.estimatedHours}
                                onChange={(e) => setEditForm(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 0 }))}
                                margin="normal"
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                fullWidth
                                type="number"
                                label="Actual Hours"
                                value={editForm.actualHours}
                                onChange={(e) => setEditForm(prev => ({ ...prev, actualHours: parseFloat(e.target.value) || 0 }))}
                                margin="normal"
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                fullWidth
                                type="number"
                                label="Est. Cost"
                                value={editForm.estimatedCost}
                                onChange={(e) => setEditForm(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) || 0 }))}
                                margin="normal"
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                fullWidth
                                type="number"
                                label="Actual Cost"
                                value={editForm.actualCost}
                                onChange={(e) => setEditForm(prev => ({ ...prev, actualCost: parseFloat(e.target.value) || 0 }))}
                                margin="normal"
                              />
                            </Grid>
                          </Grid>
                          <Box display="flex" gap={1} sx={{ mt: 2 }}>
                            <Button
                              variant="contained"
                              onClick={handleCostsUpdate}
                              disabled={loading}
                              startIcon={<SaveIcon />}
                            >
                              {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => setEditingCosts(false)}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </Box>
                      </Collapse>
                    </CardContent>
                  </Card>

                  {/* Work Order Info */}
                  <Card sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <BuildIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Work Order Info
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">
                            Work Order Number
                          </Typography>
                          <Typography variant="body2">
                            {workOrder.workOrderNumber}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">
                            Type
                          </Typography>
                          <Typography variant="body2">
                            {workOrder.type.charAt(0).toUpperCase() + workOrder.type.slice(1)}
                          </Typography>
                        </Grid>
                        {workOrder.asset && (
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                              Asset
                            </Typography>
                            <Typography variant="body2">
                              {workOrder.asset.name}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* Customer Information */}
                  {(workOrder.customer) && (
                    <Card sx={{ mt: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Customer Information
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                              Customer Name
                            </Typography>
                            <Typography variant="body2">
                              {workOrder.customer.name}
                            </Typography>
                          </Grid>
                          {workOrder.customer.address && (
                            <Grid item xs={12}>
                              <Typography variant="caption" color="text.secondary">
                                Address
                              </Typography>
                              <Typography variant="body2">
                                {workOrder.customer.address}
                              </Typography>
                            </Grid>
                          )}
                          {workOrder.customer.primaryContactName && (
                            <>
                              <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                  Primary Contact
                                </Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="body2">
                                  {workOrder.customer.primaryContactName}
                                </Typography>
                              </Grid>
                              {workOrder.customer.primaryContactPhone && (
                                <Grid item xs={12}>
                                  <Typography variant="body2" color="text.secondary">
                                    📞 {workOrder.customer.primaryContactPhone}
                                  </Typography>
                                </Grid>
                              )}
                              {workOrder.customer.primaryContactEmail && (
                                <Grid item xs={12}>
                                  <Typography variant="body2" color="text.secondary">
                                    ✉️ {workOrder.customer.primaryContactEmail}
                                  </Typography>
                                </Grid>
                              )}
                            </>
                          )}
                          {workOrder.customer.secondaryContactName && (
                            <>
                              <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mt: 1 }}>
                                  Secondary Contact
                                </Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="body2">
                                  {workOrder.customer.secondaryContactName}
                                </Typography>
                              </Grid>
                              {workOrder.customer.secondaryContactPhone && (
                                <Grid item xs={12}>
                                  <Typography variant="body2" color="text.secondary">
                                    📞 {workOrder.customer.secondaryContactPhone}
                                  </Typography>
                                </Grid>
                              )}
                              {workOrder.customer.secondaryContactEmail && (
                                <Grid item xs={12}>
                                  <Typography variant="body2" color="text.secondary">
                                    ✉️ {workOrder.customer.secondaryContactEmail}
                                  </Typography>
                                </Grid>
                              )}
                            </>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  )}
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* Status Update Dialog */}
      <Dialog open={editingStatus} onClose={() => setEditingStatus(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Work Order Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as WorkOrderStatus)}
              label="Status"
            >
              {Object.values(WorkOrderStatus).map((status) => (
                <MenuItem key={status} value={status}>
                  {status.replace('_', ' ').toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {newStatus === WorkOrderStatus.COMPLETED && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Completion Notes"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              margin="normal"
              placeholder="Describe the work completed..."
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingStatus(false)}>Cancel</Button>
          <Button onClick={handleStatusUpdate} variant="contained" disabled={loading}>
            {loading ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={editingAssignment} onClose={() => setEditingAssignment(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Work Order</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Assign To</InputLabel>
            <Select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              label="Assign To"
              disabled={users.length === 0}
            >
              <MenuItem value="">
                <em>Unassigned</em>
              </MenuItem>
              {users.filter(user => user.role === 'technician').map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </MenuItem>
              ))}
            </Select>
            {users.length === 0 && (
              <FormHelperText>Loading users...</FormHelperText>
            )}
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingAssignment(false)}>Cancel</Button>
          <Button onClick={handleAssignmentUpdate} variant="contained" disabled={loading}>
            {loading ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Comment Dialog */}
      <Dialog open={addingComment} onClose={() => setAddingComment(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            margin="normal"
            placeholder="Add your comment..."
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Comment Type</InputLabel>
            <Select
              value={isInternalComment ? 'internal' : 'public'}
              onChange={(e) => setIsInternalComment(e.target.value === 'internal')}
              label="Comment Type"
            >
              <MenuItem value="public">Public (Visible to all)</MenuItem>
              <MenuItem value="internal">Internal (Technicians only)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddingComment(false)}>Cancel</Button>
          <Button 
            onClick={handleAddComment} 
            variant="contained" 
            disabled={loading || !newComment.trim()}
          >
            {loading ? 'Adding...' : 'Add Comment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
} 