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
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import axios from 'axios';

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
  requestedBy: User;
  assignedTo?: User;
  asset?: any;
  comments: Comment[];
  attachments: any[];
  isOverdue: boolean;
  daysOverdue: number;
}

interface Comment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  author: User;
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
  const [newStatus, setNewStatus] = useState<WorkOrderStatus>(WorkOrderStatus.OPEN);
  const [completionNotes, setCompletionNotes] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  // Fetch work order details
  useEffect(() => {
    if (open && workOrderId) {
      fetchWorkOrder();
      fetchUsers();
    }
  }, [open, workOrderId]);

  const fetchWorkOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/work-orders/${workOrderId}`);
      setWorkOrder(response.data);
      setNewStatus(response.data.status);
      setSelectedTechnician(response.data.assignedToId || '');
    } catch (err) {
      setError('Failed to fetch work order details');
      console.error('Error fetching work order:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleStatusUpdate = async () => {
    if (!workOrder) return;

    try {
      setLoading(true);
      const response = await axios.put(`/api/work-orders/${workOrder.id}/status`, {
        status: newStatus,
        completionNotes: newStatus === WorkOrderStatus.COMPLETED ? completionNotes : undefined,
      });
      
      setWorkOrder(response.data);
      setEditingStatus(false);
      setCompletionNotes('');
      onUpdate?.(response.data);
    } catch (err) {
      setError('Failed to update work order status');
      console.error('Error updating status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentUpdate = async () => {
    if (!workOrder) return;

    try {
      setLoading(true);
      const response = await axios.put(`/api/work-orders/${workOrder.id}`, {
        assignedToId: selectedTechnician || null,
      });
      
      setWorkOrder(response.data);
      setEditingAssignment(false);
      onUpdate?.(response.data);
    } catch (err) {
      setError('Failed to update work order assignment');
      console.error('Error updating assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!workOrder || !newComment.trim()) return;

    try {
      setLoading(true);
      // For development, use the first user as the author
      // In production, this would come from the authenticated user context
      const currentUserId = users.length > 0 ? users[0].id : 'dev-user-id';
      
      const response = await axios.post(`/api/work-orders/${workOrder.id}/comments`, {
        content: newComment,
        isInternal: isInternalComment,
        authorId: currentUserId,
      });
      
      // Refresh work order to get updated comments
      await fetchWorkOrder();
      setNewComment('');
      setIsInternalComment(false);
      setAddingComment(false);
    } catch (err) {
      setError('Failed to add comment');
      console.error('Error adding comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date: Date | undefined) => {
    if (!date) return 'Not set';
    return dayjs(date).format('MMM DD, YYYY h:mm A');
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
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
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
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Work Order Details
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {workOrder.description}
                      </Typography>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Requested By
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <PersonIcon fontSize="small" />
                            <Typography>
                              {workOrder.requestedBy.firstName} {workOrder.requestedBy.lastName}
                            </Typography>
                          </Box>
                        </Grid>
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
                    </CardContent>
                  </Card>

                  {/* Comments Section */}
                  <Card sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Comments ({workOrder.comments.length})
                      </Typography>
                      {workOrder.comments.length === 0 ? (
                        <Typography color="text.secondary">
                          No comments yet.
                        </Typography>
                      ) : (
                        <List>
                          {workOrder.comments.map((comment, index) => (
                            <React.Fragment key={comment.id}>
                              <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                                  {comment.author.firstName[0]}
                                </Avatar>
                                <ListItemText
                                  primary={
                                    <Box display="flex" alignItems="center" gap={1}>
                                      <Typography variant="subtitle2">
                                        {comment.author.firstName} {comment.author.lastName}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {formatDateTime(comment.createdAt)}
                                      </Typography>
                                      {comment.isInternal && (
                                        <Chip label="Internal" size="small" color="warning" />
                                      )}
                                    </Box>
                                  }
                                  secondary={comment.content}
                                />
                              </ListItem>
                              {index < workOrder.comments.length - 1 && <Divider />}
                            </React.Fragment>
                          ))}
                        </List>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Side Panel */}
                <Grid item xs={12} md={4}>
                  {/* Schedule & Time Tracking */}
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Schedule & Time
                      </Typography>
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
                    </CardContent>
                  </Card>

                  {/* Estimates & Costs */}
                  <Card sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <MoneyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Estimates & Costs
                      </Typography>
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
            >
              <MenuItem value="">
                <em>Unassigned</em>
              </MenuItem>
              {users.filter(user => user.role === 'TECHNICIAN' || user.role === 'ADMINISTRATOR').map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </MenuItem>
              ))}
            </Select>
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