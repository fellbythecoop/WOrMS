'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Paper, Button } from '@mui/material';
import { AdvancedWorkOrderList } from '../work-orders/AdvancedWorkOrderList';
import { CreateWorkOrderForm } from '../work-orders/CreateWorkOrderForm';
import { EditWorkOrderForm } from '../work-orders/EditWorkOrderForm';
import { WorkOrderDetail } from '../work-orders/WorkOrderDetail';
import { AssetList } from '../assets/AssetList';
import { CreateAssetForm } from '../assets/CreateAssetForm';
import { useNotificationHelpers } from '../notifications/NotificationProvider';
import axios from 'axios';

export function Dashboard() {
  const { showSuccess, showError } = useNotificationHelpers();
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<any>(null);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    open: 0,
    inProgress: 0,
    completedToday: 0,
    overdue: 0
  });

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
      const response = await axios.get('http://localhost:3001/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const handleCreateWorkOrder = () => {
    setCreateFormOpen(true);
  };

  const handleEditWorkOrder = (workOrder: any) => {
    setSelectedWorkOrder(workOrder);
    setEditFormOpen(true);
  };

  const handleViewWorkOrder = (workOrder: any) => {
    setSelectedWorkOrderId(workOrder.id);
    setDetailViewOpen(true);
  };

  const handleDeleteWorkOrder = async (workOrderId: string) => {
    try {
      await axios.delete(`http://localhost:3001/api/work-orders/${workOrderId}`);
      showSuccess('Work order deleted successfully!');
      
      // Refresh the work orders list and stats
      await fetchWorkOrders();
      await fetchDashboardStats();
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

        {/* Work Orders Management */}
        <Grid item xs={12}>
          <AdvancedWorkOrderList
            workOrders={workOrders}
            users={users}
            loading={loading}
            onCreateNew={handleCreateWorkOrder}
            onEdit={handleEditWorkOrder}
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

      {/* Edit Work Order Form */}
      <EditWorkOrderForm
        open={editFormOpen}
        workOrder={selectedWorkOrder}
        onClose={() => {
          setEditFormOpen(false);
          setSelectedWorkOrder(null);
        }}
        onUpdate={async (updatedWorkOrder) => {
          console.log('Work order updated:', updatedWorkOrder);
          setEditFormOpen(false);
          setSelectedWorkOrder(null);
          showSuccess(`Work order ${updatedWorkOrder.workOrderNumber} updated successfully!`);
          // Refresh the work orders list and stats
          await fetchWorkOrders();
          await fetchDashboardStats();
        }}
      />

      {/* Work Order Detail View */}
      {selectedWorkOrderId && (
        <WorkOrderDetail
          workOrderId={selectedWorkOrderId}
          open={detailViewOpen}
          onClose={() => {
            setDetailViewOpen(false);
            setSelectedWorkOrderId(null);
          }}
          onUpdate={async (updatedWorkOrder) => {
            console.log('Work order updated:', updatedWorkOrder);
            // Refresh the work orders list and stats
            await fetchWorkOrders();
            await fetchDashboardStats();
          }}
        />
      )}
    </Box>
  );
} 