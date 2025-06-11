'use client';

import { Box, Container, Typography } from '@mui/material';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';

export default function HomePage() {
  return (
    <NotificationProvider>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box mb={4}>
          <Typography variant="h3" component="h1" gutterBottom>
            Work Order Management System
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Welcome to your work order dashboard
            <Typography variant="caption" display="block" color="warning.main">
              (Development mode - Authentication disabled)
            </Typography>
          </Typography>
        </Box>
        
        <Dashboard />
      </Container>
    </NotificationProvider>
  );
} 