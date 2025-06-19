'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

interface Customer {
  id: string;
  name: string;
  address?: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  secondaryContactName?: string;
  secondaryContactPhone?: string;
  secondaryContactEmail?: string;
  notes?: string;
  travelTimeRate?: number;
  straightTimeRate?: number;
  overtimeRate?: number;
  doubleTimeRate?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CustomerFormData {
  name: string;
  address: string;
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactEmail: string;
  secondaryContactName: string;
  secondaryContactPhone: string;
  secondaryContactEmail: string;
  notes: string;
  travelTimeRate: number;
  straightTimeRate: number;
  overtimeRate: number;
  doubleTimeRate: number;
}

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    address: '',
    primaryContactName: '',
    primaryContactPhone: '',
    primaryContactEmail: '',
    secondaryContactName: '',
    secondaryContactPhone: '',
    secondaryContactEmail: '',
    notes: '',
    travelTimeRate: 0,
    straightTimeRate: 0,
    overtimeRate: 0,
    doubleTimeRate: 0,
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/customers');
      setCustomers(response.data);
    } catch (err) {
      setError('Failed to fetch customers');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        address: customer.address || '',
        primaryContactName: customer.primaryContactName || '',
        primaryContactPhone: customer.primaryContactPhone || '',
        primaryContactEmail: customer.primaryContactEmail || '',
        secondaryContactName: customer.secondaryContactName || '',
        secondaryContactPhone: customer.secondaryContactPhone || '',
        secondaryContactEmail: customer.secondaryContactEmail || '',
        notes: customer.notes || '',
        travelTimeRate: customer.travelTimeRate || 0,
        straightTimeRate: customer.straightTimeRate || 0,
        overtimeRate: customer.overtimeRate || 0,
        doubleTimeRate: customer.doubleTimeRate || 0,
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        address: '',
        primaryContactName: '',
        primaryContactPhone: '',
        primaryContactEmail: '',
        secondaryContactName: '',
        secondaryContactPhone: '',
        secondaryContactEmail: '',
        notes: '',
        travelTimeRate: 0,
        straightTimeRate: 0,
        overtimeRate: 0,
        doubleTimeRate: 0,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
    setFormData({
      name: '',
      address: '',
      primaryContactName: '',
      primaryContactPhone: '',
      primaryContactEmail: '',
      secondaryContactName: '',
      secondaryContactPhone: '',
      secondaryContactEmail: '',
      notes: '',
      travelTimeRate: 0,
      straightTimeRate: 0,
      overtimeRate: 0,
      doubleTimeRate: 0,
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingCustomer) {
        await axios.put(`/api/customers/${editingCustomer.id}`, formData);
      } else {
        await axios.post('/api/customers', formData);
      }
      await fetchCustomers();
      handleCloseDialog();
    } catch (err) {
      setError('Failed to save customer');
      console.error('Error saving customer:', err);
    }
  };

  const handleDelete = async (customerId: string) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      await axios.delete(`/api/customers/${customerId}`);
      await fetchCustomers();
    } catch (err) {
      setError('Failed to delete customer');
      console.error('Error deleting customer:', err);
    }
  };

  const handleSeedCustomers = async () => {
    try {
      await axios.post('/api/customers/seed');
      await fetchCustomers();
    } catch (err) {
      setError('Failed to seed customers');
      console.error('Error seeding customers:', err);
    }
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Loading customers...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Customer Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            onClick={handleSeedCustomers}
            sx={{ mr: 2 }}
          >
            Seed Sample Customers
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Customer
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {customers.map((customer) => (
          <Grid item xs={12} md={6} lg={4} key={customer.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" component="h2">
                    {customer.name}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(customer)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(customer.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                {customer.address && (
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    📍 {customer.address}
                  </Typography>
                )}

                {customer.primaryContactName && (
                  <Box mb={1}>
                    <Typography variant="body2" fontWeight="500">
                      Primary Contact: {customer.primaryContactName}
                    </Typography>
                    {customer.primaryContactPhone && (
                      <Typography variant="body2" color="text.secondary">
                        📞 {customer.primaryContactPhone}
                      </Typography>
                    )}
                    {customer.primaryContactEmail && (
                      <Typography variant="body2" color="text.secondary">
                        ✉️ {customer.primaryContactEmail}
                      </Typography>
                    )}
                  </Box>
                )}

                {customer.secondaryContactName && (
                  <Box mb={1}>
                    <Typography variant="body2" fontWeight="500">
                      Secondary Contact: {customer.secondaryContactName}
                    </Typography>
                    {customer.secondaryContactPhone && (
                      <Typography variant="body2" color="text.secondary">
                        📞 {customer.secondaryContactPhone}
                      </Typography>
                    )}
                    {customer.secondaryContactEmail && (
                      <Typography variant="body2" color="text.secondary">
                        ✉️ {customer.secondaryContactEmail}
                      </Typography>
                    )}
                  </Box>
                )}

                {customer.notes && (
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    📝 {customer.notes}
                  </Typography>
                )}

                {/* Rate Configuration Display */}
                {(customer.travelTimeRate || customer.straightTimeRate || customer.overtimeRate || customer.doubleTimeRate) && (
                  <Box mt={1}>
                    <Typography variant="body2" fontWeight="500" mb={0.5}>
                      Rate Configuration:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {customer.travelTimeRate > 0 && (
                        <Chip 
                          label={`Travel: $${customer.travelTimeRate}/hr`} 
                          size="small" 
                          variant="outlined"
                        />
                      )}
                      {customer.straightTimeRate > 0 && (
                        <Chip 
                          label={`Straight: $${customer.straightTimeRate}/hr`} 
                          size="small" 
                          variant="outlined"
                        />
                      )}
                      {customer.overtimeRate > 0 && (
                        <Chip 
                          label={`Overtime: $${customer.overtimeRate}/hr`} 
                          size="small" 
                          variant="outlined"
                        />
                      )}
                      {customer.doubleTimeRate > 0 && (
                        <Chip 
                          label={`Double: $${customer.doubleTimeRate}/hr`} 
                          size="small" 
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                )}

                <Chip
                  label={customer.isActive ? 'Active' : 'Inactive'}
                  color={customer.isActive ? 'success' : 'default'}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Customer Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Primary Contact
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Contact Name"
                value={formData.primaryContactName}
                onChange={(e) => setFormData({ ...formData, primaryContactName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.primaryContactPhone}
                onChange={(e) => setFormData({ ...formData, primaryContactPhone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.primaryContactEmail}
                onChange={(e) => setFormData({ ...formData, primaryContactEmail: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Secondary Contact (Optional)
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Contact Name"
                value={formData.secondaryContactName}
                onChange={(e) => setFormData({ ...formData, secondaryContactName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.secondaryContactPhone}
                onChange={(e) => setFormData({ ...formData, secondaryContactPhone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.secondaryContactEmail}
                onChange={(e) => setFormData({ ...formData, secondaryContactEmail: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Rate Configuration
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Travel Time Rate"
                type="number"
                value={formData.travelTimeRate}
                onChange={(e) => setFormData({ ...formData, travelTimeRate: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Straight Time Rate"
                type="number"
                value={formData.straightTimeRate}
                onChange={(e) => setFormData({ ...formData, straightTimeRate: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Overtime Rate"
                type="number"
                value={formData.overtimeRate}
                onChange={(e) => setFormData({ ...formData, overtimeRate: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Double Time Rate"
                type="number"
                value={formData.doubleTimeRate}
                onChange={(e) => setFormData({ ...formData, doubleTimeRate: Number(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCustomer ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 