'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Stack,
  Alert,
  Chip,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Analytics as AnalyticsIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon,
} from '@mui/icons-material';
import { TechnicianScheduleCalendar } from '../scheduling/TechnicianScheduleCalendar';
import { UtilizationDashboard } from '../scheduling/UtilizationDashboard';
import { CreateScheduleDialog } from '../scheduling/CreateScheduleDialog';
import { useWebSocket } from '../websocket/WebSocketProvider';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`scheduling-tabpanel-${index}`}
      aria-labelledby={`scheduling-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `scheduling-tab-${index}`,
    'aria-controls': `scheduling-tabpanel-${index}`,
  };
}

export function SchedulingPage() {
  const [tabValue, setTabValue] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // WebSocket connection status
  const { isConnected, connectionError } = useWebSocket();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateSchedule = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <Typography variant="h4" component="h1">
              Technician Scheduling & Resource Management
            </Typography>
            {/* Connection Status Indicator */}
            <Chip
              icon={isConnected ? <OnlineIcon /> : <OfflineIcon />}
              label={isConnected ? 'Real-time Connected' : 'Offline Mode'}
              color={isConnected ? 'success' : 'warning'}
              variant={isConnected ? 'filled' : 'outlined'}
              size="small"
            />
          </Stack>
          <Typography variant="body1" color="text.secondary">
            Manage technician schedules, track utilization, and optimize resource allocation
          </Typography>
        </Box>

        {/* Connection Error Alert */}
        {connectionError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Limited Connectivity:</strong> {connectionError}
            <br />
            <Typography variant="body2" sx={{ mt: 1 }}>
              The scheduling system will continue to work, but real-time updates like drag-and-drop 
              synchronization and live conflict notifications may be unavailable.
            </Typography>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateSchedule}
          >
            Create Schedule
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Stack>

        {/* Main Content */}
        <Paper sx={{ width: '100%' }}>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="scheduling tabs">
              <Tab 
                icon={<CalendarIcon />} 
                label="Schedule Calendar" 
                {...a11yProps(0)} 
              />
              <Tab 
                icon={<AnalyticsIcon />} 
                label="Utilization Dashboard" 
                {...a11yProps(1)} 
              />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0}>
            <TechnicianScheduleCalendar 
              refreshTrigger={refreshTrigger}
              onError={setError}
              onSuccess={setSuccess}
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <UtilizationDashboard 
              refreshTrigger={refreshTrigger}
              onError={setError}
            />
          </TabPanel>
        </Paper>

        {/* Create Schedule Dialog */}
        <CreateScheduleDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSuccess={handleCreateSuccess}
          onError={setError}
        />
      </Box>
    </Container>
  );
} 