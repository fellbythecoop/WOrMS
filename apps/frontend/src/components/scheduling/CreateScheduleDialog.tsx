'use client';

import React, { useState, useEffect } from 'react';
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
  FormHelperText,
  Switch,
  FormControlLabel,
  Chip,
  Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';

// Types
interface Technician {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: string;
}

interface CreateScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
  preselectedTechnician?: string;
  preselectedDate?: Dayjs;
}

interface ScheduleFormData {
  technicianId: string;
  date: Date;
  availableHours: number;
  scheduledHours: number;
  notes?: string;
  isAvailable: boolean;
}

// Validation schema
const scheduleSchema = yup.object({
  technicianId: yup.string().required('Technician is required'),
  date: yup.date().required('Date is required').min(new Date(), 'Date cannot be in the past'),
  availableHours: yup
    .number()
    .required('Available hours is required')
    .min(0, 'Available hours must be non-negative')
    .max(24, 'Available hours cannot exceed 24'),
  scheduledHours: yup
    .number()
    .required('Scheduled hours is required')
    .min(0, 'Scheduled hours must be non-negative')
    .max(24, 'Scheduled hours cannot exceed 24'),
  notes: yup.string().max(500, 'Notes cannot exceed 500 characters'),
  isAvailable: yup.boolean().required(),
});

// Configure API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const api = axios.create({
  baseURL: API_BASE_URL,
});

export function CreateScheduleDialog({
  open,
  onClose,
  onSuccess,
  onError,
  preselectedTechnician,
  preselectedDate,
}: CreateScheduleDialogProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
    setValue,
  } = useForm<ScheduleFormData>({
    resolver: yupResolver(scheduleSchema),
    defaultValues: {
      technicianId: '',
      date: new Date(),
      availableHours: 8,
      scheduledHours: 0,
      notes: '',
      isAvailable: true,
    },
    mode: 'onChange',
  });

  const watchedValues = watch();

  // Filtered technicians (only technicians and admins)
  const filteredTechnicians = technicians.filter(tech => 
    tech.role === 'technician' || tech.role === 'administrator'
  );

  // Calculate utilization percentage
  const utilizationPercentage = watchedValues.availableHours > 0 
    ? Math.round((watchedValues.scheduledHours / watchedValues.availableHours) * 100)
    : 0;

  // Get utilization status
  const getUtilizationStatus = (percentage: number) => {
    if (percentage < 80) return { status: 'under', color: 'warning', text: 'Under-utilized' };
    if (percentage > 100) return { status: 'over', color: 'error', text: 'Over-allocated' };
    return { status: 'optimal', color: 'success', text: 'Optimal' };
  };

  const utilization = getUtilizationStatus(utilizationPercentage);

  // Fetch technicians
  const fetchTechnicians = async () => {
    try {
      const response = await api.get('/api/users');
      setTechnicians(response.data.filter((user: any) => 
        user.role === 'technician' || user.role === 'administrator'
      ));
    } catch (error) {
      console.error('Failed to fetch technicians:', error);
      onError?.('Failed to load technicians');
    }
  };

  // Submit form
  const onSubmit = async (data: ScheduleFormData) => {
    try {
      setLoading(true);

      const scheduleData = {
        technicianId: data.technicianId,
        date: dayjs(data.date).format('YYYY-MM-DD'),
        availableHours: data.availableHours,
        scheduledHours: data.scheduledHours,
        notes: data.notes?.trim() || undefined,
        isAvailable: data.isAvailable,
      };

      await api.post('/api/scheduling', scheduleData);

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Failed to create schedule:', error);
      
      if (error.response?.status === 409) {
        onError('A schedule already exists for this technician on this date');
      } else if (error.response?.status === 400) {
        onError(error.response?.data?.message || 'Invalid schedule data');
      } else {
        onError('Failed to create schedule. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    if (!loading) {
      reset();
      onClose();
    }
  };

  // Effects
  useEffect(() => {
    if (open) {
      fetchTechnicians();
      
      // Set preselected values
      if (preselectedTechnician) {
        setValue('technicianId', preselectedTechnician);
      }
      if (preselectedDate) {
        setValue('date', preselectedDate.toDate());
      }
    }
  }, [open, preselectedTechnician, preselectedDate, setValue]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit(onSubmit),
      }}
    >
      <DialogTitle>
        <Typography variant="h6">Create New Schedule</Typography>
        <Typography variant="body2" color="text.secondary">
          Schedule a technician for a specific date with available and scheduled hours
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Technician Selection */}
          <Grid item xs={12} md={6}>
            <Controller
              name="technicianId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.technicianId}>
                  <InputLabel>Technician *</InputLabel>
                  <Select
                    {...field}
                    label="Technician *"
                    disabled={loadingTechnicians}
                  >
                    {filteredTechnicians.map((tech) => (
                      <MenuItem key={tech.id} value={tech.id}>
                        <Box>
                          <Typography variant="body2">
                            {tech.firstName} {tech.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {tech.department || 'No Department'} • {tech.email}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.technicianId && (
                    <FormHelperText>{errors.technicianId.message}</FormHelperText>
                  )}
                  {loadingTechnicians && (
                    <FormHelperText>Loading technicians...</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Grid>

          {/* Date Selection */}
          <Grid item xs={12} md={6}>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Date *"
                  value={dayjs(field.value)}
                  onChange={(date) => field.onChange(date?.toDate())}
                  minDate={dayjs()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.date,
                      helperText: errors.date?.message,
                    },
                  }}
                />
              )}
            />
          </Grid>

          {/* Available Hours */}
          <Grid item xs={12} md={6}>
            <Controller
              name="availableHours"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Available Hours *"
                  type="number"
                  fullWidth
                  inputProps={{ 
                    min: 0, 
                    max: 24, 
                    step: 0.25,
                  }}
                  error={!!errors.availableHours}
                  helperText={errors.availableHours?.message || 'Default is 8 hours per day'}
                />
              )}
            />
          </Grid>

          {/* Scheduled Hours */}
          <Grid item xs={12} md={6}>
            <Controller
              name="scheduledHours"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Scheduled Hours *"
                  type="number"
                  fullWidth
                  inputProps={{ 
                    min: 0, 
                    max: 24, 
                    step: 0.25,
                  }}
                  error={!!errors.scheduledHours}
                  helperText={errors.scheduledHours?.message || 'Hours currently scheduled for work orders'}
                />
              )}
            />
          </Grid>

          {/* Utilization Display */}
          <Grid item xs={12}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2">
                  Utilization Preview
                </Typography>
                <Chip
                  label={`${utilizationPercentage}% - ${utilization.text}`}
                  color={utilization.color as any}
                  size="small"
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {watchedValues.scheduledHours}h scheduled of {watchedValues.availableHours}h available
              </Typography>
            </Box>
          </Grid>

          {/* Availability Toggle */}
          <Grid item xs={12}>
            <Controller
              name="isAvailable"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={field.onChange}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">
                        Technician is available for work
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Uncheck if technician is on leave, vacation, or unavailable
                      </Typography>
                    </Box>
                  }
                />
              )}
            />
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Notes"
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Optional notes about this schedule (e.g., special projects, training, etc.)"
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
                />
              )}
            />
          </Grid>

          {/* Warnings */}
          {utilizationPercentage > 100 && (
            <Grid item xs={12}>
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Over-allocation Warning:</strong> This schedule has more hours assigned ({watchedValues.scheduledHours}h) 
                  than available ({watchedValues.availableHours}h). This may cause scheduling conflicts.
                </Typography>
              </Alert>
            </Grid>
          )}

                     {utilizationPercentage < 80 && watchedValues.scheduledHours > 0 && (
             <Grid item xs={12}>
               <Alert severity="info">
                 <Typography variant="body2">
                   <strong>Under-utilization:</strong> This technician has {watchedValues.availableHours - watchedValues.scheduledHours}h 
                   of remaining capacity that could be utilized for additional work orders.
                 </Typography>
               </Alert>
             </Grid>
           )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !isValid}
        >
          {loading ? 'Creating...' : 'Create Schedule'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 