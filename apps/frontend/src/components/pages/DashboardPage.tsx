'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Paper, Button, Chip } from '@mui/material';
import { Security as SecurityIcon, People as PeopleIcon, Work as WorkIcon, Build as BuildIcon } from '@mui/icons-material';
import { useNotificationHelpers } from '../notifications/NotificationProvider';
import axios from 'axios';

// Define enums to match backend
enum UserRole {
  TECHNICIAN = 'technician',
  ADMINISTRATOR = 'administrator',
  REQUESTER = 'requester',
  MANAGER = 'manager',
}

export function DashboardPage() {
  const { showSuccess, showError } = useNotificationHelpers();
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    open: 0,
    inProgress: 0,
    completedToday: 0,
    overdue: 0
  });

  // Mock current user for development (in production this would come from auth context)
  const currentUser = {
    id: 'dev-user-1',
    email: 'developer@company.com',
    firstName: 'Dev',
    lastName: 'User',
    role: UserRole.ADMINISTRATOR,
    status: 'active',
  };

  const isAdmin = currentUser.role === UserRole.ADMINISTRATOR;

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardStats();
    fetchWorkOrders();
    fetchUsers();
    fetchAssets();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      const response = await axios.get('/api/work-orders');
      setWorkOrders(response.data);
    } catch (error) {
      console.error('Error fetching work orders:', error);
      setWorkOrders([]);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/api/work-orders/stats/dashboard');
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await axios.get('/api/assets');
      setAssets(response.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate user statistics
  const userStats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    technicians: users.filter(u => u.role === UserRole.TECHNICIAN).length,
    administrators: users.filter(u => u.role === UserRole.ADMINISTRATOR).length,
  };

  // Calculate asset statistics
  const assetStats = {
    total: assets.length,
    active: assets.filter(a => a.status === 'active').length,
    maintenance: assets.filter(a => a.status === 'maintenance').length,
    retired: assets.filter(a => a.status === 'retired').length,
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome to your work order management dashboard
          <Typography variant="caption" display="block" color="warning.main">
            (Development mode - Authentication disabled)
          </Typography>
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Work Order Overview Cards */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Work Orders Overview
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Open Work Orders
              </Typography>
              <Typography variant="h4">
                {dashboardStats.open}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                In Progress
              </Typography>
              <Typography variant="h4">
                {dashboardStats.inProgress}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Completed Today
              </Typography>
              <Typography variant="h4">
                {dashboardStats.completedToday}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Overdue
              </Typography>
              <Typography variant="h4" color="error">
                {dashboardStats.overdue}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* User Management Section (Admin Only) */}
        {isAdmin && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <SecurityIcon color="primary" />
                  <Typography variant="h6">User Management</Typography>
                </Box>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {userStats.total}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Users
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {userStats.active}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Users
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="info.main">
                        {userStats.technicians}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Technicians
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="error.main">
                        {userStats.administrators}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Administrators
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Quick User List */}
              <Box mt={2}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Recent Users
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {users.slice(0, 5).map((user) => (
                    <Chip
                      key={user.id}
                      label={`${user.firstName} ${user.lastName}`}
                      size="small"
                      color={user.role === UserRole.ADMINISTRATOR ? 'error' : 
                             user.role === UserRole.MANAGER ? 'warning' : 
                             user.role === UserRole.TECHNICIAN ? 'info' : 'default'}
                      variant="outlined"
                    />
                  ))}
                  {users.length > 5 && (
                    <Chip
                      label={`+${users.length - 5} more`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Asset Overview Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <BuildIcon color="primary" />
              <Typography variant="h6">Asset Overview</Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {assetStats.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Assets
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {assetStats.active}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Assets
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {assetStats.maintenance}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      In Maintenance
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main">
                      {assetStats.retired}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Retired Assets
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Recent Work Orders */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <WorkIcon color="primary" />
              <Typography variant="h6">Recent Work Orders</Typography>
            </Box>
            
            <Box display="flex" gap={1} flexWrap="wrap">
              {workOrders.slice(0, 10).map((workOrder) => (
                <Chip
                  key={workOrder.id}
                  label={`${workOrder.workOrderNumber} - ${workOrder.title}`}
                  size="small"
                  color={workOrder.status === 'completed' ? 'success' : 
                         workOrder.status === 'in_progress' ? 'info' : 
                         workOrder.status === 'overdue' ? 'error' : 'default'}
                  variant="outlined"
                />
              ))}
              {workOrders.length > 10 && (
                <Chip
                  label={`+${workOrders.length - 10} more`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
} 