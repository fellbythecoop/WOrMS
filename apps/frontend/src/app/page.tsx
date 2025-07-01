'use client';

import { useState } from 'react';
import { Box } from '@mui/material';
import { Navigation, NavigationPage } from '@/components/common/Navigation';
import { DashboardPage } from '@/components/pages/DashboardPage';
import { WorkOrdersPage } from '@/components/pages/WorkOrdersPage';
import { AssetsPage } from '@/components/pages/AssetsPage';
import { UsersPage } from '@/components/pages/UsersPage';
import { ReportsPage } from '@/components/pages/ReportsPage';
import { CustomersPage } from '@/components/pages/CustomersPage';
import { SchedulingPage } from '@/components/pages/SchedulingPage';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { WebSocketProvider } from '@/components/websocket/WebSocketProvider';

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'work-orders':
        return <WorkOrdersPage />;
      case 'scheduling':
        return <SchedulingPage />;
      case 'assets':
        return <AssetsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'users':
        return <UsersPage />;
      case 'customers':
        return <CustomersPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <NotificationProvider>
      <WebSocketProvider>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navigation
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            isAdmin={true} // For development, always show admin features
          />
          <Box sx={{ flexGrow: 1, pt: 8 }}> {/* pt: 8 accounts for the AppBar height */}
            {renderCurrentPage()}
          </Box>
        </Box>
      </WebSocketProvider>
    </NotificationProvider>
  );
} 