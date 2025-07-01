'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  InputAdornment,
  Drawer,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  WorkOutline as WorkIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';
import { useWebSocket } from '../websocket/WebSocketProvider';

// Types
interface Technician {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: string;
}

interface WorkOrder {
  id: string;
  workOrderNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  estimatedHours: number;
  scheduledStartDate: string;
  scheduledEndDate?: string;
  assignedToId: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  asset?: {
    id: string;
    name: string;
    assetNumber: string;
  };
  customer?: {
    id: string;
    name: string;
  };
}

interface DragData {
  workOrderId: string;
  workOrderNumber: string;
  title: string;
  estimatedHours: number;
  fromTechnicianId?: string;
  fromDate?: string;
}

interface TechnicianScheduleCalendarProps {
  refreshTrigger?: number;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

// Configure API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const api = axios.create({
  baseURL: API_BASE_URL,
});

const SIDEBAR_WIDTH = 400;

export function TechnicianScheduleCalendar({ refreshTrigger, onError, onSuccess }: TechnicianScheduleCalendarProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [scheduledWorkOrders, setScheduledWorkOrders] = useState<WorkOrder[]>([]);
  const [activeWorkOrders, setActiveWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [draggedWorkOrder, setDraggedWorkOrder] = useState<DragData | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ technicianId: string; date: string } | null>(null);
  
  // Sidebar filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // WebSocket for real-time updates
  const { 
    isConnected, 
    joinScheduleRoom, 
    leaveScheduleRoom, 
    onScheduleUpdate, 
    onWorkOrderReassignment,
    onScheduleConflict 
  } = useWebSocket();

  // Generate date range based on view mode
  const dateRange = useMemo(() => {
    const start = viewMode === 'week' 
      ? currentDate.startOf('week')
      : currentDate.startOf('month');
    const end = viewMode === 'week'
      ? currentDate.endOf('week')
      : currentDate.endOf('month');
    
    const dates: Dayjs[] = [];
    let current = start;
    while (current.isBefore(end) || current.isSame(end, 'day')) {
      dates.push(current);
      current = current.add(1, 'day');
    }
    return dates;
  }, [currentDate, viewMode]);

  // Filtered technicians (only technicians and admins)
  const filteredTechnicians = useMemo(() => {
    return technicians.filter(tech => 
      tech.role === 'technician' || tech.role === 'administrator'
    );
  }, [technicians]);

  // Filtered active work orders
  const filteredActiveWorkOrders = useMemo(() => {
    return activeWorkOrders.filter(workOrder => {
      const matchesSearch = !searchTerm || 
        workOrder.workOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workOrder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workOrder.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workOrder.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || workOrder.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || workOrder.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [activeWorkOrders, searchTerm, statusFilter, priorityFilter]);

  // Group scheduled work orders by technician and date
  const workOrderGrid = useMemo(() => {
    const grid: Record<string, Record<string, WorkOrder[]>> = {};
    
    filteredTechnicians.forEach(tech => {
      grid[tech.id] = {};
      dateRange.forEach(date => {
        const dateKey = date.format('YYYY-MM-DD');
        grid[tech.id][dateKey] = [];
      });
    });

    scheduledWorkOrders.forEach(workOrder => {
      const techId = workOrder.assignedToId;
      const dateKey = dayjs(workOrder.scheduledStartDate).format('YYYY-MM-DD');
      if (grid[techId] && grid[techId][dateKey]) {
        grid[techId][dateKey].push(workOrder);
      }
    });

    return grid;
  }, [scheduledWorkOrders, filteredTechnicians, dateRange]);

  // Fetch technicians
  const fetchTechnicians = async () => {
    try {
      const response = await api.get('/api/users');
      setTechnicians(response.data);
    } catch (error) {
      console.error('Failed to fetch technicians:', error);
      onError?.('Failed to load technicians');
    }
  };

  // Fetch scheduled work orders
  const fetchScheduledWorkOrders = async () => {
    try {
      setLoading(true);
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[dateRange.length - 1].format('YYYY-MM-DD');
      
      const params: any = {
        startDate,
        endDate,
      };
      
      if (selectedTechnician !== 'all') {
        params.technicianId = selectedTechnician;
      }

      const response = await api.get('/api/work-orders/scheduled', { params });
      setScheduledWorkOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch scheduled work orders:', error);
      onError?.('Failed to load scheduled work orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch active work orders for sidebar
  const fetchActiveWorkOrders = async () => {
    try {
      const response = await api.get('/api/work-orders/active');
      setActiveWorkOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch active work orders:', error);
      onError?.('Failed to load active work orders');
    }
  };

  // Effects
  useEffect(() => {
    fetchTechnicians();
    fetchActiveWorkOrders();
  }, []);

  useEffect(() => {
    if (technicians.length > 0) {
      fetchScheduledWorkOrders();
    }
  }, [currentDate, viewMode, selectedTechnician, refreshTrigger, technicians]);

  // WebSocket effects for real-time updates
  useEffect(() => {
    if (isConnected) {
      joinScheduleRoom();
      if (selectedTechnician !== 'all') {
        joinScheduleRoom(selectedTechnician);
      }
      dateRange.forEach(date => {
        joinScheduleRoom(undefined, date.format('YYYY-MM-DD'));
      });

      return () => {
        leaveScheduleRoom();
        if (selectedTechnician !== 'all') {
          leaveScheduleRoom(selectedTechnician);
        }
        dateRange.forEach(date => {
          leaveScheduleRoom(undefined, date.format('YYYY-MM-DD'));
        });
      };
    }
  }, [isConnected, selectedTechnician, dateRange]);

  // Listen for real-time updates
  useEffect(() => {
    const unsubscribeScheduleUpdate = onScheduleUpdate((data) => {
      fetchScheduledWorkOrders();
      fetchActiveWorkOrders();
    });

    const unsubscribeReassignment = onWorkOrderReassignment((data) => {
      onSuccess?.(`Work order ${data.workOrderNumber} was reassigned`);
      fetchScheduledWorkOrders();
      fetchActiveWorkOrders();
    });

    const unsubscribeConflict = onScheduleConflict((data) => {
      onError?.(`Schedule conflict detected: ${data.conflictData[0]?.message || 'Unknown conflict'}`);
    });

    return () => {
      unsubscribeScheduleUpdate();
      unsubscribeReassignment();
      unsubscribeConflict();
    };
  }, [onScheduleUpdate, onWorkOrderReassignment, onScheduleConflict, onSuccess, onError]);

  // Navigation
  const navigatePrevious = () => {
    setCurrentDate(prev => prev.subtract(1, viewMode));
  };

  const navigateNext = () => {
    setCurrentDate(prev => prev.add(1, viewMode));
  };

  const navigateToday = () => {
    setCurrentDate(dayjs());
  };

  // Drag and drop handlers
  const handleDragStart = (event: React.DragEvent, workOrder: WorkOrder | DragData, isFromSidebar = false) => {
    let dragData: DragData;
    
    if (isFromSidebar) {
      // Work order from sidebar
      const wo = workOrder as WorkOrder;
      dragData = {
        workOrderId: wo.id,
        workOrderNumber: wo.workOrderNumber,
        title: wo.title,
        estimatedHours: wo.estimatedHours,
      };
    } else {
      // Work order from calendar
      const wo = workOrder as WorkOrder;
      dragData = {
        workOrderId: wo.id,
        workOrderNumber: wo.workOrderNumber,
        title: wo.title,
        estimatedHours: wo.estimatedHours,
        fromTechnicianId: wo.assignedToId,
        fromDate: dayjs(wo.scheduledStartDate).format('YYYY-MM-DD'),
      };
    }
    
    setDraggedWorkOrder(dragData);
    event.dataTransfer.setData('application/json', JSON.stringify(dragData));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event: React.DragEvent, technicianId: string, date: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverCell({ technicianId, date });
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = async (event: React.DragEvent, technicianId: string, date: string) => {
    event.preventDefault();
    setDragOverCell(null);

    try {
      const dragDataStr = event.dataTransfer.getData('application/json');
      const dragData: DragData = JSON.parse(dragDataStr);

      // Don't allow dropping on the same cell
      if (dragData.fromTechnicianId === technicianId && dragData.fromDate === date) {
        return;
      }

      // Call the assignment API
      const newScheduledDate = dayjs(date).hour(8).minute(0).second(0).toISOString();
      
      const response = await api.post(`/api/work-orders/${dragData.workOrderId}/assign`, {
        assignedToId: technicianId,
        scheduledStartDate: newScheduledDate,
        estimatedHours: dragData.estimatedHours,
        forceAssign: true,
      });

      if (response.data.warnings && response.data.warnings.length > 0) {
        const hasErrors = response.data.warnings.some((w: any) => w.severity === 'error');
        if (hasErrors) {
          const errorMessages = response.data.warnings
            .filter((w: any) => w.severity === 'error')
            .map((w: any) => w.message)
            .join(', ');
          onError?.(`Assignment failed: ${errorMessages}`);
          return;
        } else {
          const warningMessages = response.data.warnings
            .map((w: any) => w.message)
            .join(', ');
          onSuccess?.(`Work order assigned with warnings: ${warningMessages}`);
        }
      } else {
        onSuccess?.(`Work order ${dragData.workOrderNumber} successfully assigned`);
      }

      // Refresh data
      fetchScheduledWorkOrders();
      fetchActiveWorkOrders();

    } catch (error: any) {
      console.error('Failed to assign work order:', error);
      if (error.response?.data?.warnings) {
        const errorMessages = error.response.data.warnings
          .map((w: any) => w.message)
          .join(', ');
        onError?.(`Assignment failed: ${errorMessages}`);
      } else {
        onError?.('Failed to assign work order');
      }
    } finally {
      setDraggedWorkOrder(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedWorkOrder(null);
    setDragOverCell(null);
  };

  // Get priority color for work orders
  const getPriorityColor = (priority: string): string => {
    switch (priority.toLowerCase()) {
      case 'critical': return '#d32f2f';
      case 'high': return '#f57c00';
      case 'medium': return '#1976d2';
      case 'low': return '#388e3c';
      default: return '#757575';
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'open': return '#1976d2';
      case 'in_progress': return '#f57c00';
      case 'pending': return '#9c27b0';
      case 'assigned': return '#2e7d32';
      case 'completed': return '#388e3c';
      default: return '#757575';
    }
  };

  // Calculate work order span across days
  const getWorkOrderSpan = (workOrder: WorkOrder): number => {
    if (!workOrder.scheduledEndDate) return 1;
    
    const start = dayjs(workOrder.scheduledStartDate);
    const end = dayjs(workOrder.scheduledEndDate);
    const days = end.diff(start, 'day') + 1;
    
    return Math.max(1, Math.min(days, dateRange.length));
  };

  // Check if work order should be displayed on this date
  const shouldDisplayWorkOrder = (workOrder: WorkOrder, date: Dayjs): boolean => {
    const workOrderStart = dayjs(workOrder.scheduledStartDate);
    const workOrderEnd = workOrder.scheduledEndDate ? dayjs(workOrder.scheduledEndDate) : workOrderStart;
    
    return date.isSameOrAfter(workOrderStart, 'day') && date.isSameOrBefore(workOrderEnd, 'day');
  };

  // Render schedule cell
  const renderScheduleCell = (technician: Technician, date: Dayjs) => {
    const dateKey = date.format('YYYY-MM-DD');
    const cellWorkOrders = workOrderGrid[technician.id]?.[dateKey] || [];
    const isToday = date.isSame(dayjs(), 'day');
    const isPast = date.isBefore(dayjs(), 'day');
    const isDragOver = dragOverCell?.technicianId === technician.id && dragOverCell?.date === dateKey;

    return (
      <Card
        key={`${technician.id}-${dateKey}`}
        sx={{
          minHeight: 100,
          border: isToday ? '2px solid' : '1px solid',
          borderColor: isDragOver ? 'primary.main' : (isToday ? 'primary.main' : 'divider'),
          backgroundColor: isDragOver ? 'primary.light' : (isPast ? 'grey.50' : 'background.paper'),
          opacity: isPast ? 0.7 : 1,
          transition: 'all 0.2s ease-in-out',
        }}
        onDragOver={(e) => handleDragOver(e, technician.id, dateKey)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, technician.id, dateKey)}
      >
        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
          <Box sx={{ minHeight: 80 }}>
            {cellWorkOrders.map((workOrder) => (
              <Chip
                key={workOrder.id}
                label={`${workOrder.workOrderNumber}`}
                size="small"
                draggable
                onDragStart={(e) => handleDragStart(e, workOrder)}
                onDragEnd={handleDragEnd}
                sx={{
                  mb: 0.5,
                  mr: 0.5,
                  fontSize: '0.7rem',
                  height: 24,
                  cursor: 'grab',
                  backgroundColor: getPriorityColor(workOrder.priority),
                  color: 'white',
                  '&:hover': {
                    backgroundColor: getPriorityColor(workOrder.priority),
                    opacity: 0.8,
                  },
                  '&:active': {
                    cursor: 'grabbing',
                  },
                }}
                title={`${workOrder.title} - ${workOrder.priority} priority - ${workOrder.estimatedHours}h`}
              />
            ))}
          </Box>

          {isDragOver && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'primary.main',
                opacity: 0.1,
                pointerEvents: 'none',
              }}
            />
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Main Calendar Area */}
      <Box sx={{ flexGrow: 1, mr: `${SIDEBAR_WIDTH}px`, p: 2 }}>
        {/* Header Controls */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton onClick={navigatePrevious}>
              <ChevronLeftIcon />
            </IconButton>
            
            <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>
              {viewMode === 'week' 
                ? `Week of ${currentDate.startOf('week').format('MMM DD, YYYY')}`
                : currentDate.format('MMMM YYYY')
              }
            </Typography>
            
            <IconButton onClick={navigateNext}>
              <ChevronRightIcon />
            </IconButton>
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<TodayIcon />}
              onClick={navigateToday}
            >
              Today
            </Button>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>View</InputLabel>
              <Select
                value={viewMode}
                label="View"
                onChange={(e) => setViewMode(e.target.value as 'week' | 'month')}
              >
                <MenuItem value="week">Week</MenuItem>
                <MenuItem value="month">Month</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Technician</InputLabel>
              <Select
                value={selectedTechnician}
                label="Technician"
                onChange={(e) => setSelectedTechnician(e.target.value)}
              >
                <MenuItem value="all">All Technicians</MenuItem>
                {filteredTechnicians.map((tech) => (
                  <MenuItem key={tech.id} value={tech.id}>
                    {tech.firstName} {tech.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        {/* Loading */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Calendar Grid */}
        <Paper sx={{ p: 2 }}>
          {/* Date Headers */}
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={2}>
              <Typography variant="subtitle2" fontWeight="bold">
                Technician
              </Typography>
            </Grid>
            {dateRange.map((date) => (
              <Grid item xs={10 / dateRange.length} key={date.format('YYYY-MM-DD')}>
                <Box textAlign="center">
                  <Typography variant="subtitle2" fontWeight="bold">
                    {date.format('ddd')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {date.format('MMM DD')}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ mb: 2 }} />

          {/* Technician Rows */}
          {filteredTechnicians.map((technician) => (
            <Box key={technician.id} sx={{ mb: 2 }}>
              <Grid container spacing={1} alignItems="stretch">
                {/* Technician Info */}
                <Grid item xs={2}>
                  <Paper sx={{ p: 1, height: '100%', display: 'flex', alignItems: 'center' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        <PersonIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {technician.firstName} {technician.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {technician.department || 'No Department'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Schedule Cells */}
                {dateRange.map((date) => (
                  <Grid item xs={10 / dateRange.length} key={date.format('YYYY-MM-DD')}>
                    {renderScheduleCell(technician, date)}
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}

          {/* Empty State */}
          {filteredTechnicians.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ScheduleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No technicians found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add technicians to start scheduling
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Right Sidebar - Active Work Orders */}
      <Box
        sx={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: SIDEBAR_WIDTH,
          bgcolor: 'background.paper',
          borderLeft: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Active Work Orders
          </Typography>
          
          {/* Search */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search by work order number, title, or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {/* Filters */}
          <Stack direction="row" spacing={1}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="assigned">Assigned</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priorityFilter}
                label="Priority"
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {/* Work Orders List */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {filteredActiveWorkOrders.length > 0 ? (
            <List sx={{ p: 0 }}>
              {filteredActiveWorkOrders.map((workOrder) => (
                <ListItem
                  key={workOrder.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, workOrder, true)}
                  onDragEnd={handleDragEnd}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    cursor: 'grab',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    '&:active': {
                      cursor: 'grabbing',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getPriorityColor(workOrder.priority) }}>
                      <WorkIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" fontWeight="medium">
                          {workOrder.workOrderNumber}
                        </Typography>
                        <Stack direction="row" spacing={0.5}>
                          <Chip
                            label={workOrder.priority}
                            size="small"
                            sx={{
                              bgcolor: getPriorityColor(workOrder.priority),
                              color: 'white',
                              fontSize: '0.65rem',
                              height: 20,
                            }}
                          />
                          <Chip
                            label={workOrder.status}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(workOrder.status),
                              color: 'white',
                              fontSize: '0.65rem',
                              height: 20,
                            }}
                          />
                        </Stack>
                      </Stack>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span" sx={{ display: 'block', mt: 0.5 }}>
                          {workOrder.title}
                        </Typography>
                        {workOrder.customer && (
                          <span style={{ display: 'block', marginTop: '4px' }}>
                            <BusinessIcon sx={{ fontSize: 14, color: 'text.secondary', verticalAlign: 'middle', mr: 0.5 }} />
                            <Typography variant="caption" component="span" color="text.secondary">
                              {workOrder.customer.name}
                            </Typography>
                          </span>
                        )}
                        <span style={{ display: 'block', marginTop: '4px' }}>
                          <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary', verticalAlign: 'middle', mr: 0.5 }} />
                          <Typography variant="caption" component="span" color="text.secondary">
                            {workOrder.estimatedHours}h estimated
                          </Typography>
                        </span>
                        {workOrder.assignedTo && (
                          <span style={{ display: 'block', marginTop: '4px' }}>
                            <PersonIcon sx={{ fontSize: 14, color: 'text.secondary', verticalAlign: 'middle', mr: 0.5 }} />
                            <Typography variant="caption" component="span" color="text.secondary">
                              {workOrder.assignedTo.firstName} {workOrder.assignedTo.lastName}
                            </Typography>
                          </span>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No work orders found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search or filters
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}