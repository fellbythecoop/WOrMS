'use client';

import React, { useState } from 'react';
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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Types matching backend
export enum AssetStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
}

export enum AssetCategory {
  EQUIPMENT = 'equipment',
  FACILITY = 'facility',
  VEHICLE = 'vehicle',
  IT = 'it',
  FURNITURE = 'furniture',
  OTHER = 'other',
}

interface CreateAssetFormData {
  name: string;
  description?: string;
  category: AssetCategory;
  status: AssetStatus;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  location?: string;
  department?: string;
  purchasePrice?: number;
  purchaseDate?: Dayjs | null;
  warrantyExpiration?: Dayjs | null;
  nextMaintenanceDate?: Dayjs | null;
  specifications?: string;
}

interface CreateAssetFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAssetFormData) => void;
}

const schema = yup.object().shape({
  name: yup.string().required('Asset name is required').max(255, 'Name must be less than 255 characters'),
  description: yup.string().optional().max(1000, 'Description must be less than 1000 characters'),
  category: yup.mixed<AssetCategory>().required('Category is required'),
  status: yup.mixed<AssetStatus>().required('Status is required'),
  manufacturer: yup.string().optional().max(100, 'Manufacturer must be less than 100 characters'),
  model: yup.string().optional().max(100, 'Model must be less than 100 characters'),
  serialNumber: yup.string().optional().max(50, 'Serial number must be less than 50 characters'),
  location: yup.string().optional().max(255, 'Location must be less than 255 characters'),
  department: yup.string().optional().max(100, 'Department must be less than 100 characters'),
  purchasePrice: yup.number().optional().positive('Purchase price must be positive').nullable(),
  purchaseDate: yup.mixed().optional().nullable(),
  warrantyExpiration: yup.mixed().optional().nullable(),
  nextMaintenanceDate: yup.mixed().optional().nullable(),
  specifications: yup.string().optional().max(2000, 'Specifications must be less than 2000 characters'),
});

export function CreateAssetForm({ open, onClose, onSubmit }: CreateAssetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAssetFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: '',
      description: '',
      category: AssetCategory.EQUIPMENT,
      status: AssetStatus.ACTIVE,
      manufacturer: '',
      model: '',
      serialNumber: '',
      location: '',
      department: '',
      purchasePrice: undefined,
      purchaseDate: null,
      warrantyExpiration: null,
      nextMaintenanceDate: null,
      specifications: '',
    },
  });

  const handleFormSubmit = async (data: CreateAssetFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      setSubmitError('Failed to create asset. Please try again.');
      console.error('Error creating asset:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setSubmitError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Asset</DialogTitle>
      
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
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Asset Name"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    required
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth required>
                    <InputLabel>Category</InputLabel>
                    <Select {...field} label="Category" error={!!errors.category}>
                      {Object.values(AssetCategory).map((category) => (
                        <MenuItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </MenuItem>
                      ))}
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
                    rows={3}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>

            {/* Asset Details */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Asset Details
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth required>
                    <InputLabel>Status</InputLabel>
                    <Select {...field} label="Status" error={!!errors.status}>
                      {Object.values(AssetStatus).map((status) => (
                        <MenuItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="manufacturer"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Manufacturer"
                    error={!!errors.manufacturer}
                    helperText={errors.manufacturer?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="model"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Model"
                    error={!!errors.model}
                    helperText={errors.model?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="serialNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Serial Number"
                    error={!!errors.serialNumber}
                    helperText={errors.serialNumber?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Location"
                    error={!!errors.location}
                    helperText={errors.location?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="department"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Department"
                    error={!!errors.department}
                    helperText={errors.department?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="purchasePrice"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Purchase Price"
                    type="number"
                    InputProps={{
                      startAdornment: '$',
                    }}
                    error={!!errors.purchasePrice}
                    helperText={errors.purchasePrice?.message}
                  />
                )}
              />
            </Grid>

            {/* Dates */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Important Dates
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="purchaseDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Purchase Date"
                    value={field.value}
                    onChange={field.onChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.purchaseDate,
                        helperText: errors.purchaseDate?.message,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="warrantyExpiration"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Warranty Expiration"
                    value={field.value}
                    onChange={field.onChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.warrantyExpiration,
                        helperText: errors.warrantyExpiration?.message,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="nextMaintenanceDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Next Maintenance Date"
                    value={field.value}
                    onChange={field.onChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.nextMaintenanceDate,
                        helperText: errors.nextMaintenanceDate?.message,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Specifications */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Additional Information
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="specifications"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Specifications"
                    multiline
                    rows={4}
                    error={!!errors.specifications}
                    helperText={errors.specifications?.message}
                    placeholder="Enter detailed specifications, notes, or additional information about this asset..."
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
          {isSubmitting ? 'Creating...' : 'Create Asset'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 