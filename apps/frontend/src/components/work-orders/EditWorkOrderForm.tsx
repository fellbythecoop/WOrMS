'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';

interface WorkOrder {
  id: string;
  workOrderNumber: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'pending' | 'completed' | 'cancelled' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'maintenance' | 'repair' | 'inspection' | 'installation' | 'emergency';
  estimatedHours?: number;
  actualHours?: number;
  estimatedCost?: number;
  actualCost?: number;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  assignedToId?: string;
  requestedById?: string;
}

interface EditWorkOrderFormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  estimatedHours?: number;
  actualHours?: number;
  estimatedCost?: number;
  actualCost?: number;
  scheduledStartDate?: Dayjs | null;
  scheduledEndDate?: Dayjs | null;
  actualStartDate?: Dayjs | null;
  actualEndDate?: Dayjs | null;
  assignedToId?: string;
}

interface EditWorkOrderFormProps {
  open: boolean;
  workOrder: WorkOrder | null;
  onClose: () => void;
  onUpdate: (workOrder: WorkOrder) => void;
}

const schema = yup.object().shape({
  title: yup.string().required('Title is required').max(255, 'Title must be less than 255 characters'),
  description: yup.string().required('Description is required').max(1000, 'Description must be less than 1000 characters'),
  status: yup.string().required('Status is required'),
  priority: yup.string().required('Priority is required'),
  type: yup.string().required('Type is required'),
  estimatedHours: yup.number().positive('Estimated hours must be positive').nullable(),
  actualHours: yup.number().positive('Actual hours must be positive').nullable(),
  estimatedCost: yup.number().positive('Estimated cost must be positive').nullable(),
  actualCost: yup.number().positive('Actual cost must be positive').nullable(),
  assignedToId: yup.string().nullable(),
  assetId: yup.string().nullable(),
});

export function EditWorkOrderForm({ open, workOrder, onClose, onUpdate }: EditWorkOrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditWorkOrderFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      title: '',
      description: '',
      status: 'open',
      priority: 'medium',
      type: 'maintenance',
      estimatedHours: undefined,
      actualHours: undefined,
      estimatedCost: undefined,
      actualCost: undefined,
      scheduledStartDate: null,
      scheduledEndDate: null,
      actualStartDate: null,
      actualEndDate: null,
      assignedToId: '',
    },
  });

  // Load users on component mount
  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  // Populate form when workOrder changes
  useEffect(() => {
    if (workOrder && open) {
      reset({
        title: workOrder.title,
        description: workOrder.description,
        status: workOrder.status,
        priority: workOrder.priority,
        type: workOrder.type,
        estimatedHours: workOrder.estimatedHours ?? undefined,
        actualHours: workOrder.actualHours ?? undefined,
        estimatedCost: workOrder.estimatedCost ?? undefined,
        actualCost: workOrder.actualCost ?? undefined,
        scheduledStartDate: workOrder.scheduledStartDate ? dayjs(workOrder.scheduledStartDate) : null,
        scheduledEndDate: workOrder.scheduledEndDate ? dayjs(workOrder.scheduledEndDate) : null,
        actualStartDate: workOrder.actualStartDate ? dayjs(workOrder.actualStartDate) : null,
        actualEndDate: workOrder.actualEndDate ? dayjs(workOrder.actualEndDate) : null,
        assignedToId: workOrder.assignedToId || '',
      });
    }
  }, [workOrder, open, reset]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Set empty array as fallback
      setUsers([]);
    }
  };



  const handleFormSubmit = async (data: EditWorkOrderFormData) => {
    if (!workOrder) return;
    
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Convert dates to ISO strings
      const submitData = {
        ...data,
        scheduledStartDate: data.scheduledStartDate?.toISOString(),
        scheduledEndDate: data.scheduledEndDate?.toISOString(),
        actualStartDate: data.actualStartDate?.toISOString(),
        actualEndDate: data.actualEndDate?.toISOString(),
        assignedToId: data.assignedToId || null,
      };

      const response = await axios.put(`http://localhost:3001/api/work-orders/${workOrder.id}`, submitData);
      onUpdate(response.data);
      onClose();
    } catch (error) {
      setSubmitError('Failed to update work order. Please try again.');
      console.error('Error updating work order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSubmitError(null);
      onClose();
    }
  };

  if (!workOrder) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Edit Work Order: {workOrder.workOrderNumber}
      </DialogTitle>
      
      <DialogContent>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <Box component="form" sx={{ mt: 1 }}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={8}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Work Order Title"
                    error={!!errors.title}
                    helperText={errors.title?.message}
                    required
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth required>
                    <InputLabel>Status</InputLabel>
                    <Select {...field} label="Status" error={!!errors.status}>
                      <MenuItem value="open">Open</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                      <MenuItem value="closed">Closed</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Description"
                    multiline
                    rows={4}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    required
                  />
                )}
              />
            </Grid>

            {/* Priority and Type */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Classification
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth required>
                    <InputLabel>Priority</InputLabel>
                    <Select {...field} label="Priority" error={!!errors.priority}>
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="critical">Critical</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth required>
                    <InputLabel>Type</InputLabel>
                    <Select {...field} label="Type" error={!!errors.type}>
                      <MenuItem value="maintenance">Maintenance</MenuItem>
                      <MenuItem value="repair">Repair</MenuItem>
                      <MenuItem value="inspection">Inspection</MenuItem>
                      <MenuItem value="installation">Installation</MenuItem>
                      <MenuItem value="emergency">Emergency</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Assignment */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Assignment
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="assignedToId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Assigned To</InputLabel>
                    <Select {...field} label="Assigned To">
                      <MenuItem value="">Unassigned</MenuItem>
                      {users.length === 0 ? (
                        <MenuItem disabled>Loading users...</MenuItem>
                      ) : (
                        users.map((user) => (
                          <MenuItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.role})
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>



            {/* Time and Cost Estimates */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Time & Cost Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={3}>
              <Controller
                name="estimatedHours"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    fullWidth
                    label="Estimated Hours"
                    type="number"
                    error={!!errors.estimatedHours}
                    helperText={errors.estimatedHours?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Controller
                name="actualHours"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    fullWidth
                    label="Actual Hours"
                    type="number"
                    error={!!errors.actualHours}
                    helperText={errors.actualHours?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Controller
                name="estimatedCost"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    fullWidth
                    label="Estimated Cost"
                    type="number"
                    InputProps={{
                      startAdornment: '$',
                    }}
                    error={!!errors.estimatedCost}
                    helperText={errors.estimatedCost?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Controller
                name="actualCost"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    fullWidth
                    label="Actual Cost"
                    type="number"
                    InputProps={{
                      startAdornment: '$',
                    }}
                    error={!!errors.actualCost}
                    helperText={errors.actualCost?.message}
                  />
                )}
              />
            </Grid>

            {/* Scheduling */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Scheduling
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="scheduledStartDate"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    label="Scheduled Start Date"
                    value={field.value}
                    onChange={field.onChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.scheduledStartDate,
                        helperText: errors.scheduledStartDate?.message,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="scheduledEndDate"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    label="Scheduled End Date"
                    value={field.value}
                    onChange={field.onChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.scheduledEndDate,
                        helperText: errors.scheduledEndDate?.message,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="actualStartDate"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    label="Actual Start Date"
                    value={field.value}
                    onChange={field.onChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.actualStartDate,
                        helperText: errors.actualStartDate?.message,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="actualEndDate"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    label="Actual End Date"
                    value={field.value}
                    onChange={field.onChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.actualEndDate,
                        helperText: errors.actualEndDate?.message,
                      },
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(handleFormSubmit)}
          variant="contained"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Updating...' : 'Update Work Order'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 