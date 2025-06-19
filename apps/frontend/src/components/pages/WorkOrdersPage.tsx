'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { WorkOrderList } from '../work-orders/WorkOrderList';
import { AdvancedWorkOrderList } from '../work-orders/AdvancedWorkOrderList';
import { CreateWorkOrderForm } from '../work-orders/CreateWorkOrderForm';
import { WorkOrderDetail } from '../work-orders/WorkOrderDetail';
import { WorkOrder } from '../work-orders/WorkOrderList';
import { useNotificationHelpers } from '../notifications/NotificationProvider';
import axios from 'axios';

export function WorkOrdersPage() {
  const { showSuccess, showError } = useNotificationHelpers();
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data on component mount
  useEffect(() => {
    fetchWorkOrders();
    fetchUsers();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/work-orders');
      setWorkOrders(response.data);
    } catch (error) {
      console.error('Error fetching work orders:', error);
      setWorkOrders([]);
    } finally {
      setLoading(false);
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
      await fetchWorkOrders();
    } catch (error) {
      console.error('Error creating work order:', error);
      showError('Failed to create work order. Please try again.');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Work Orders
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage and track all work orders in the system
        </Typography>
      </Box>

      <AdvancedWorkOrderList
        workOrders={workOrders}
        users={users}
        loading={loading}
        onCreateNew={handleCreateWorkOrder}
        onView={handleViewWorkOrder}
        onDelete={handleDeleteWorkOrder}
        onRefresh={fetchWorkOrders}
      />

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
            // Refresh the work orders list when work order is updated
            await fetchWorkOrders();
          }}
        />
      )}
    </Container>
  );
} 