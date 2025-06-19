'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs from 'dayjs';

// Enums matching backend
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

interface CreateWorkOrderFormData {
  title: string;
  description: string;
  priority: WorkOrderPriority;
  type: WorkOrderType;
  estimatedHours?: number;
  estimatedCost?: number;
  scheduledStartDate?: Date;
  scheduledEndDate?: Date;
  assetId?: string;
  assignedToId?: string;
  customerId?: string;
}

interface CreateWorkOrderFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWorkOrderFormData) => Promise<void>;
  loading?: boolean;
}

const validationSchema = yup.object({
  title: yup.string().required('Title is required').min(3, 'Title must be at least 3 characters'),
  description: yup.string().required('Description is required').min(10, 'Description must be at least 10 characters'),
  priority: yup.string().oneOf(Object.values(WorkOrderPriority)).required('Priority is required'),
  type: yup.string().oneOf(Object.values(WorkOrderType)).required('Type is required'),
  estimatedHours: yup.number().min(0, 'Must be non-negative').required(),
  estimatedCost: yup.number().min(0, 'Must be non-negative').required(),
  scheduledStartDate: yup.date().optional(),
  scheduledEndDate: yup.date().optional(),
});

export function CreateWorkOrderForm({ open, onClose, onSubmit, loading = false }: CreateWorkOrderFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<CreateWorkOrderFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      priority: WorkOrderPriority.MEDIUM,
      type: WorkOrderType.MAINTENANCE,
      estimatedHours: 0,
      estimatedCost: 0,
      scheduledStartDate: undefined,
      scheduledEndDate: undefined,
      customerId: '',
    },
  });

  const handleFormSubmit = async (data: CreateWorkOrderFormData) => {
    try {
      setSubmitError(null);
      // Convert 0 values to undefined for optional fields
      const submitData = {
        ...data,
        estimatedHours: data.estimatedHours === 0 ? undefined : data.estimatedHours,
        estimatedCost: data.estimatedCost === 0 ? undefined : data.estimatedCost,
      };
      await onSubmit(submitData as any);
      reset();
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create work order');
    }
  };

  const handleClose = () => {
    reset();
    setSubmitError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontSize: '1.5rem', fontWeight: 500 }}>
        Create New Work Order
      </DialogTitle>
      
      <DialogContent>
        <Box component="form" sx={{ mt: 2 }}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Title */}
            <Grid item xs={12}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Work Order Title"
                    fullWidth
                    error={!!errors.title}
                    helperText={errors.title?.message}
                    placeholder="Brief description of the work needed"
                  />
                )}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Detailed Description"
                    fullWidth
                    multiline
                    rows={4}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    placeholder="Provide detailed information about the work to be performed..."
                  />
                )}
              />
            </Grid>

            {/* Priority and Type */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.priority}>
                    <InputLabel>Priority</InputLabel>
                    <Select {...field} label="Priority">
                      <MenuItem value={WorkOrderPriority.LOW}>Low</MenuItem>
                      <MenuItem value={WorkOrderPriority.MEDIUM}>Medium</MenuItem>
                      <MenuItem value={WorkOrderPriority.HIGH}>High</MenuItem>
                      <MenuItem value={WorkOrderPriority.CRITICAL}>Critical</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.type}>
                    <InputLabel>Type</InputLabel>
                    <Select {...field} label="Type">
                      <MenuItem value={WorkOrderType.MAINTENANCE}>Maintenance</MenuItem>
                      <MenuItem value={WorkOrderType.REPAIR}>Repair</MenuItem>
                      <MenuItem value={WorkOrderType.INSPECTION}>Inspection</MenuItem>
                      <MenuItem value={WorkOrderType.INSTALLATION}>Installation</MenuItem>
                      <MenuItem value={WorkOrderType.EMERGENCY}>Emergency</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Estimates */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="estimatedHours"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                    label="Estimated Hours"
                    type="number"
                    fullWidth
                    error={!!errors.estimatedHours}
                    helperText={errors.estimatedHours?.message || "Enter 0 if not applicable"}
                    inputProps={{ min: 0, step: 0.5 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="estimatedCost"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                    label="Estimated Cost ($)"
                    type="number"
                    fullWidth
                    error={!!errors.estimatedCost}
                    helperText={errors.estimatedCost?.message || "Enter 0 if not applicable"}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                )}
              />
            </Grid>

            {/* Scheduled Dates */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="scheduledStartDate"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    label="Scheduled Start Date"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date?.toDate())}
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

            <Grid item xs={12} sm={6}>
              <Controller
                name="scheduledEndDate"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    label="Scheduled End Date"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date?.toDate())}
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

            {/* Customer Selection */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 2, color: 'primary.main' }}>
                Customer Information
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="customerId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Select Customer</InputLabel>
                    <Select {...field} label="Select Customer">
                      <MenuItem value="">
                        <em>No customer selected</em>
                      </MenuItem>
                      {/* Customer options will be populated dynamically */}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(handleFormSubmit)}
          variant="contained"
          disabled={loading || !isValid}
        >
          {loading ? 'Creating...' : 'Create Work Order'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 