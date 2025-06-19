'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Paper, Button, Chip } from '@mui/material';
import { Security as SecurityIcon, People as PeopleIcon } from '@mui/icons-material';
import { AdvancedWorkOrderList } from '../work-orders/AdvancedWorkOrderList';
import { CreateWorkOrderForm } from '../work-orders/CreateWorkOrderForm';
import { WorkOrderDetail } from '../work-orders/WorkOrderDetail';
import { AssetList } from '../assets/AssetList';
import { CreateAssetForm } from '../assets/CreateAssetForm';
import UserManagement from '../users/UserManagement';
import { useNotificationHelpers } from '../notifications/NotificationProvider';
import axios from 'axios';

// Define enums to match backend
enum UserRole {
  TECHNICIAN = 'technician',
  ADMINISTRATOR = 'administrator',
  REQUESTER = 'requester',
  MANAGER = 'manager',
}

export function Dashboard() {
  const { showSuccess, showError } = useNotificationHelpers();
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
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
    fetchWorkOrders();
    fetchDashboardStats();
    fetchUsers();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/work-orders');
      setWorkOrders(response.data);
    } catch (error) {
      console.error('Error fetching work orders:', error);
      // Keep empty array if API fails
      setWorkOrders([]);
    } finally {
      setLoading(false);
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

  const handleCreateWorkOrder = () => {
    setCreateFormOpen(true);
  };

  const handleViewWorkOrder = (workOrder: any) => {
    setSelectedWorkOrderId(workOrder.id);
    setDetailViewOpen(true);
  };

  const handleDeleteWorkOrder = async (workOrderId: string) => {
    try {
      await axios.delete(`/api/work-orders/${workOrderId}`);
      showSuccess('Work order deleted successfully!');
      await fetchWorkOrders();
    } catch (error) {
      console.error('Error deleting work order:', error);
      showError('Failed to delete work order. Please try again.');
    }
  };

  const handleCreateSubmit = async (data: any) => {
    try {
      const response = await axios.post('/api/work-orders', data);
      console.log('Work order created:', response.data);
      setCreateFormOpen(false);
      showSuccess(`Work order ${response.data.workOrderNumber} created successfully!`);
      
      // Refresh the work orders list and stats
      await fetchWorkOrders();
      await fetchDashboardStats();
    } catch (error) {
      console.error('Error creating work order:', error);
      showError('Failed to create work order. Please try again.');
    }
  };

  const handleOpenUserManagement = () => {
    setUserManagementOpen(true);
  };

  // Calculate user statistics
  const userStats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    technicians: users.filter(u => u.role === UserRole.TECHNICIAN).length,
    administrators: users.filter(u => u.role === UserRole.ADMINISTRATOR).length,
  };

  if (userManagementOpen) {
    return (
      <UserManagement 
        currentUserRole={currentUser.role as UserRole}
      />
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Overview Cards */}
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
                <Button
                  variant="contained"
                  startIcon={<PeopleIcon />}
                  onClick={handleOpenUserManagement}
                >
                  Manage Users
                </Button>
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

        {/* Work Orders Management */}
        <Grid item xs={12}>
          <AdvancedWorkOrderList
            workOrders={workOrders}
            users={users}
            loading={loading}
            onCreateNew={handleCreateWorkOrder}
            onView={handleViewWorkOrder}
            onDelete={handleDeleteWorkOrder}
            onRefresh={() => {
              fetchWorkOrders();
              fetchDashboardStats();
            }}
          />
        </Grid>
      </Grid>

      {/* Create Work Order Form */}
      <CreateWorkOrderForm
        open={createFormOpen}
        onClose={() => setCreateFormOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      {/* Work Order Detail View */}
      {selectedWorkOrderId && (
        <WorkOrderDetail
          open={detailViewOpen}
          workOrderId={selectedWorkOrderId}
          onClose={() => {
            setDetailViewOpen(false);
            setSelectedWorkOrderId(null);
          }}
          onUpdate={async (updatedWorkOrder: any) => {
            // Refresh the work orders list and stats when work order is updated
            await fetchWorkOrders();
            await fetchDashboardStats();
          }}
        />
      )}
    </Box>
  );
} 