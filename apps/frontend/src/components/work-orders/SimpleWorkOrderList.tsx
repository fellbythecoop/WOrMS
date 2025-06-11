'use client';

import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';

// Simple interface for work orders
interface SimpleWorkOrder {
  id: string;
  workOrderNumber: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  assignedTo?: {
    firstName: string;
    lastName: string;
  };
}

interface SimpleWorkOrderListProps {
  workOrders: SimpleWorkOrder[];
  onCreateNew: () => void;
  onEdit: (workOrder: SimpleWorkOrder) => void;
  onView: (workOrder: SimpleWorkOrder) => void;
  onDelete: (workOrderId: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'info';
    case 'in_progress': return 'warning';
    case 'completed': return 'success';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low': return 'success';
    case 'medium': return 'info';
    case 'high': return 'warning';
    case 'critical': return 'error';
    default: return 'default';
  }
};

export function SimpleWorkOrderList({
  workOrders,
  onCreateNew,
  onEdit,
  onView,
  onDelete,
}: SimpleWorkOrderListProps) {
  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Work Orders
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateNew}
        >
          Create New Work Order
        </Button>
      </Box>

      {/* Simple Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>WO Number</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workOrders.map((workOrder) => (
              <TableRow key={workOrder.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {workOrder.workOrderNumber}
                  </Typography>
                </TableCell>
                <TableCell>{workOrder.title}</TableCell>
                <TableCell>
                  <Chip
                    label={workOrder.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(workOrder.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={workOrder.priority.toUpperCase()}
                    color={getPriorityColor(workOrder.priority) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {workOrder.assignedTo ? (
                    <Typography variant="body2">
                      {workOrder.assignedTo.firstName} {workOrder.assignedTo.lastName}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Unassigned
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {dayjs(workOrder.createdAt).format('MMM DD, YYYY')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      onClick={() => onView(workOrder)}
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onEdit(workOrder)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onDelete(workOrder.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
} 