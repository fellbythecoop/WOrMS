'use client';

import { useState } from 'react';
import { Box, Typography, Container } from '@mui/material';
import { AssetList } from '../assets/AssetList';
import { CreateAssetForm } from '../assets/CreateAssetForm';
import { useNotificationHelpers } from '../notifications/NotificationProvider';
import axios from 'axios';

export function AssetsPage() {
  const { showSuccess, showError } = useNotificationHelpers();
  const [createFormOpen, setCreateFormOpen] = useState(false);

  const handleCreateAsset = () => {
    setCreateFormOpen(true);
  };

  const handleEditAsset = (asset: any) => {
    // TODO: Implement edit functionality
    console.log('Edit asset:', asset);
  };

  const handleViewAsset = (asset: any) => {
    // TODO: Implement view functionality
    console.log('View asset:', asset);
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await axios.delete(`/api/assets/${assetId}`);
      showSuccess('Asset deleted successfully!');
      // Refresh the asset list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting asset:', error);
      showError('Failed to delete asset. Please try again.');
    }
  };

  const handleCreateSubmit = async (data: any) => {
    try {
      const response = await axios.post('/api/assets', data);
      console.log('Asset created:', response.data);
      setCreateFormOpen(false);
      showSuccess('Asset created successfully!');
      // Refresh the asset list
      window.location.reload();
    } catch (error) {
      console.error('Error creating asset:', error);
      showError('Failed to create asset. Please try again.');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Assets
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage equipment, facilities, and other assets in the system
        </Typography>
      </Box>

      <AssetList
        onCreateNew={handleCreateAsset}
        onEdit={handleEditAsset}
        onView={handleViewAsset}
        onDelete={handleDeleteAsset}
      />
      
      <CreateAssetForm
        open={createFormOpen}
        onClose={() => setCreateFormOpen(false)}
        onSubmit={handleCreateSubmit}
      />
    </Container>
  );
} 