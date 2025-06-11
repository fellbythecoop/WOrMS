'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  IconButton,
  Collapse,
  Badge,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

// Enhanced interface for work orders
interface AdvancedWorkOrder {
  id: string;
  workOrderNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  requestedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  asset?: {
    id: string;
    name: string;
    assetNumber: string;
  };
}

interface FilterState {
  search: string;
  status: string[];
  priority: string[];
  type: string[];
  assignedTo: string[];
  dateFrom: Dayjs | null;
  dateTo: Dayjs | null;
  overdueBOnly: boolean;
}

interface AdvancedWorkOrderListProps {
  workOrders: AdvancedWorkOrder[];
  users: Array<{ id: string; firstName: string; lastName: string; email: string; }>;
  loading?: boolean;
  onCreateNew: () => void;
  onEdit: (workOrder: AdvancedWorkOrder) => void;
  onView: (workOrder: AdvancedWorkOrder) => void;
  onDelete: (workOrderId: string) => void;
  onRefresh?: () => void;
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open', color: 'info' },
  { value: 'in_progress', label: 'In Progress', color: 'warning' },
  { value: 'pending', label: 'Pending', color: 'secondary' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'error' },
  { value: 'closed', label: 'Closed', color: 'default' },
] as const;

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'info' },
  { value: 'high', label: 'High', color: 'warning' },
  { value: 'critical', label: 'Critical', color: 'error' },
] as const;

const TYPE_OPTIONS = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'repair', label: 'Repair' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'installation', label: 'Installation' },
  { value: 'emergency', label: 'Emergency' },
] as const;

export function AdvancedWorkOrderList({
  workOrders,
  users,
  loading = false,
  onCreateNew,
  onEdit,
  onView,
  onDelete,
  onRefresh,
}: AdvancedWorkOrderListProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: [],
    priority: [],
    type: [],
    assignedTo: [],
    dateFrom: null,
    dateTo: null,
    overdueBOnly: false,
  });
  
  const [showFilters, setShowFilters] = useState(false);

  // Filter work orders based on current filter state
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((workOrder) => {
      // Text search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          workOrder.workOrderNumber.toLowerCase().includes(searchLower) ||
          workOrder.title.toLowerCase().includes(searchLower) ||
          workOrder.description.toLowerCase().includes(searchLower) ||
          (workOrder.assignedTo && 
            `${workOrder.assignedTo.firstName} ${workOrder.assignedTo.lastName}`.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(workOrder.status)) {
        return false;
      }

      // Priority filter
      if (filters.priority.length > 0 && !filters.priority.includes(workOrder.priority)) {
        return false;
      }

      // Type filter
      if (filters.type.length > 0 && !filters.type.includes(workOrder.type)) {
        return false;
      }

      // Assigned technician filter
      if (filters.assignedTo.length > 0) {
        if (!workOrder.assignedTo || !filters.assignedTo.includes(workOrder.assignedTo.id)) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const workOrderDate = dayjs(workOrder.createdAt);
        if (filters.dateFrom && workOrderDate.isBefore(filters.dateFrom, 'day')) {
          return false;
        }
        if (filters.dateTo && workOrderDate.isAfter(filters.dateTo, 'day')) {
          return false;
        }
      }

      // Overdue filter
      if (filters.overdueBOnly) {
        if (!workOrder.dueDate || dayjs(workOrder.dueDate).isAfter(dayjs())) {
          return false;
        }
      }

      return true;
    });
  }, [workOrders, filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status.length > 0) count++;
    if (filters.priority.length > 0) count++;
    if (filters.type.length > 0) count++;
    if (filters.assignedTo.length > 0) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.overdueBOnly) count++;
    return count;
  }, [filters]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: [],
      priority: [],
      type: [],
      assignedTo: [],
      dateFrom: null,
      dateTo: null,
      overdueBOnly: false,
    });
  };

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'workOrderNumber',
      headerName: 'WO Number',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight="medium">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const statusOption = STATUS_OPTIONS.find(s => s.value === params.value);
        return (
          <Chip
            label={statusOption?.label || params.value}
            color={statusOption?.color as any}
            size="small"
          />
        );
      },
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const priorityOption = PRIORITY_OPTIONS.find(p => p.value === params.value);
        return (
          <Chip
            label={priorityOption?.label || params.value}
            color={priorityOption?.color as any}
            size="small"
          />
        );
      },
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const typeOption = TYPE_OPTIONS.find(t => t.value === params.value);
        return (
          <Chip
            label={typeOption?.label || params.value}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'assignedTo',
      headerName: 'Assigned To',
      width: 180,
      renderCell: (params: GridRenderCellParams) => {
        const assignedTo = params.value;
        return assignedTo ? (
          <Typography variant="body2">
            {assignedTo.firstName} {assignedTo.lastName}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Unassigned
          </Typography>
        );
      },
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">
          {dayjs(params.value).format('MMM DD, YYYY')}
        </Typography>
      ),
    },
    {
      field: 'dueDate',
      headerName: 'Due Date',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.value) return '-';
        const dueDate = dayjs(params.value);
        const isOverdue = dueDate.isBefore(dayjs());
        return (
          <Typography 
            variant="body2" 
            color={isOverdue ? 'error' : 'text.primary'}
            fontWeight={isOverdue ? 'medium' : 'normal'}
          >
            {dueDate.format('MMM DD, YYYY')}
          </Typography>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton
            size="small"
            onClick={() => onView(params.row)}
            title="View Details"
          >
            <ViewIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onEdit(params.row)}
            title="Edit Work Order"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDelete(params.row.id)}
            color="error"
            title="Delete Work Order"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Work Orders
          {filteredWorkOrders.length !== workOrders.length && (
            <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
              ({filteredWorkOrders.length} of {workOrders.length})
            </Typography>
          )}
        </Typography>
        <Stack direction="row" spacing={2}>
          {onRefresh && (
            <Button variant="outlined" onClick={onRefresh}>
              Refresh
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateNew}
          >
            Create New Work Order
          </Button>
        </Stack>
      </Box>

      {/* Search and Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Search */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search work orders..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>

            {/* Filter Toggle */}
            <Grid item xs={12} md={8}>
              <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2}>
                {activeFilterCount > 0 && (
                  <Button
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                )}
                <Badge badgeContent={activeFilterCount} color="primary">
                  <Button
                    variant={showFilters ? "contained" : "outlined"}
                    startIcon={<FilterIcon />}
                    endIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    Filters
                  </Button>
                </Badge>
              </Box>
            </Grid>
          </Grid>

          {/* Advanced Filters */}
          <Collapse in={showFilters}>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              {/* Status Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    multiple
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      status: typeof e.target.value === 'string' ? [e.target.value] : e.target.value 
                    }))}
                    label="Status"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const option = STATUS_OPTIONS.find(s => s.value === value);
                          return (
                            <Chip key={value} label={option?.label} size="small" />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Priority Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select
                    multiple
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      priority: typeof e.target.value === 'string' ? [e.target.value] : e.target.value 
                    }))}
                    label="Priority"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const option = PRIORITY_OPTIONS.find(p => p.value === value);
                          return (
                            <Chip key={value} label={option?.label} size="small" />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {PRIORITY_OPTIONS.map((priority) => (
                      <MenuItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Type Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    multiple
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      type: typeof e.target.value === 'string' ? [e.target.value] : e.target.value 
                    }))}
                    label="Type"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const option = TYPE_OPTIONS.find(t => t.value === value);
                          return (
                            <Chip key={value} label={option?.label} size="small" />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {TYPE_OPTIONS.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Assigned To Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Assigned To</InputLabel>
                  <Select
                    multiple
                    value={filters.assignedTo}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      assignedTo: typeof e.target.value === 'string' ? [e.target.value] : e.target.value 
                    }))}
                    label="Assigned To"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const user = users.find(u => u.id === value);
                          return (
                            <Chip 
                              key={value} 
                              label={user ? `${user.firstName} ${user.lastName}` : 'Unknown'} 
                              size="small" 
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Date Range */}
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="From Date"
                  value={filters.dateFrom}
                  onChange={(newValue) => setFilters(prev => ({ ...prev, dateFrom: newValue }))}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="To Date"
                  value={filters.dateTo}
                  onChange={(newValue) => setFilters(prev => ({ ...prev, dateTo: newValue }))}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
            </Grid>
          </Collapse>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Box sx={{ height: 600 }}>
        <DataGrid
          rows={filteredWorkOrders}
          columns={columns}
          loading={loading}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 },
            },
            sorting: {
              sortModel: [{ field: 'createdAt', sort: 'desc' }],
            },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          checkboxSelection
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        />
      </Box>
    </Paper>
  );
} 