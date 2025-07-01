'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import {
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Types
interface UtilizationStats {
  totalSchedules: number;
  totalAvailableHours: number;
  totalScheduledHours: number;
  averageUtilization: number;
  overallocatedCount: number;
  underutilizedCount: number;
  optimalCount: number;
  schedules: Schedule[];
}

interface Schedule {
  id: string;
  date: string;
  availableHours: number;
  scheduledHours: number;
  notes?: string;
  isAvailable: boolean;
  technicianId: string;
  technician: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    department?: string;
  };
  utilizationPercentage: number;
  remainingHours: number;
  isOverallocated: boolean;
  utilizationStatus: 'under' | 'optimal' | 'over';
}

interface Technician {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: string;
}

interface UtilizationDashboardProps {
  refreshTrigger?: number;
  onError?: (error: string) => void;
}

// Configure API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const api = axios.create({
  baseURL: API_BASE_URL,
});

export function UtilizationDashboard({ refreshTrigger, onError }: UtilizationDashboardProps) {
  const [stats, setStats] = useState<UtilizationStats | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');
  const [startDate, setStartDate] = useState<Dayjs>(dayjs().subtract(1, 'month'));
  const [endDate, setEndDate] = useState<Dayjs>(dayjs());

  // Filtered technicians (only technicians and admins)
  const filteredTechnicians = useMemo(() => {
    return technicians.filter(tech => 
      tech.role === 'technician' || tech.role === 'administrator'
    );
  }, [technicians]);

  // Technician utilization summary
  const technicianSummary = useMemo(() => {
    if (!stats) return [];

    const technicianMap = new Map<string, {
      technician: Schedule['technician'];
      totalScheduled: number;
      totalAvailable: number;
      scheduleCount: number;
      overallocatedDays: number;
      underutilizedDays: number;
      optimalDays: number;
    }>();

    stats.schedules.forEach(schedule => {
      const techId = schedule.technicianId;
      if (!technicianMap.has(techId)) {
        technicianMap.set(techId, {
          technician: schedule.technician,
          totalScheduled: 0,
          totalAvailable: 0,
          scheduleCount: 0,
          overallocatedDays: 0,
          underutilizedDays: 0,
          optimalDays: 0,
        });
      }

      const summary = technicianMap.get(techId)!;
      summary.totalScheduled += schedule.scheduledHours;
      summary.totalAvailable += schedule.availableHours;
      summary.scheduleCount += 1;

      switch (schedule.utilizationStatus) {
        case 'over':
          summary.overallocatedDays += 1;
          break;
        case 'under':
          summary.underutilizedDays += 1;
          break;
        case 'optimal':
          summary.optimalDays += 1;
          break;
      }
    });

    return Array.from(technicianMap.values())
      .map(summary => ({
        ...summary,
        averageUtilization: summary.totalAvailable > 0 
          ? Math.round((summary.totalScheduled / summary.totalAvailable) * 100)
          : 0,
      }))
      .sort((a, b) => b.averageUtilization - a.averageUtilization);
  }, [stats]);

  // Chart data for utilization categories pie chart
  const utilizationPieData = useMemo(() => {
    if (!stats) return null;

    return {
      labels: ['Optimal (80-100%)', 'Under-utilized (<80%)', 'Over-allocated (>100%)'],
      datasets: [
        {
          data: [stats.optimalCount, stats.underutilizedCount, stats.overallocatedCount],
          backgroundColor: [
            '#2e7d32', // success green
            '#ed6c02', // warning orange
            '#d32f2f', // error red
          ],
          borderColor: [
            '#1b5e20',
            '#e65100',
            '#c62828',
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [stats]);

  // Chart data for technician utilization bar chart
  const technicianBarData = useMemo(() => {
    if (!technicianSummary.length) return null;

    // Take top 10 technicians for better visualization
    const topTechnicians = technicianSummary.slice(0, 10);

    return {
      labels: topTechnicians.map(t => `${t.technician.firstName} ${t.technician.lastName}`),
      datasets: [
        {
          label: 'Utilization %',
          data: topTechnicians.map(t => t.averageUtilization),
          backgroundColor: topTechnicians.map(t => {
            if (t.averageUtilization < 80) return '#ed6c02'; // warning
            if (t.averageUtilization > 100) return '#d32f2f'; // error
            return '#2e7d32'; // success
          }),
          borderColor: topTechnicians.map(t => {
            if (t.averageUtilization < 80) return '#e65100';
            if (t.averageUtilization > 100) return '#c62828';
            return '#1b5e20';
          }),
          borderWidth: 2,
        },
      ],
    };
  }, [technicianSummary]);

  // Chart options
  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Utilization Category Distribution',
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Top Technicians by Utilization',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 120,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          },
        },
      },
    },
  };

  // Fetch technicians
  const fetchTechnicians = async () => {
    try {
      const response = await api.get('/api/users');
      setTechnicians(response.data);
    } catch (error) {
      console.error('Failed to fetch technicians:', error);
      onError?.('Failed to load technicians');
    }
  };

  // Fetch utilization stats
  const fetchUtilizationStats = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
      };
      
      if (selectedTechnician !== 'all') {
        params.technicianId = selectedTechnician;
      }

      const response = await api.get('/api/scheduling/utilization/stats', { params });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch utilization stats:', error);
      onError?.('Failed to load utilization statistics');
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchTechnicians();
  }, []);

  useEffect(() => {
    if (technicians.length > 0) {
      fetchUtilizationStats();
    }
  }, [startDate, endDate, selectedTechnician, refreshTrigger, technicians]);

  // Get utilization color
  const getUtilizationColor = (percentage: number) => {
    if (percentage < 80) return 'warning';
    if (percentage > 100) return 'error';
    return 'success';
  };

  // Get utilization status text
  const getUtilizationStatusText = (percentage: number) => {
    if (percentage < 80) return 'Under-utilized';
    if (percentage > 100) return 'Over-allocated';
    return 'Optimal';
  };

  return (
    <Box>
      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <DatePicker
          label="Start Date"
          value={startDate}
          onChange={(newValue) => newValue && setStartDate(newValue)}
          slotProps={{ textField: { size: 'small' } }}
        />
        <DatePicker
          label="End Date"
          value={endDate}
          onChange={(newValue) => newValue && setEndDate(newValue)}
          slotProps={{ textField: { size: 'small' } }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Technician</InputLabel>
          <Select
            value={selectedTechnician}
            label="Technician"
            onChange={(e) => setSelectedTechnician(e.target.value)}
          >
            <MenuItem value="all">All Technicians</MenuItem>
            {filteredTechnicians.map((tech) => (
              <MenuItem key={tech.id} value={tech.id}>
                {tech.firstName} {tech.lastName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Loading */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Overall Stats */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <AssessmentIcon color="primary" />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.averageUtilization}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Average Utilization
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <ScheduleIcon color="info" />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.totalScheduledHours}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Scheduled Hours
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <CheckCircleIcon color="success" />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.optimalCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Optimal Days
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <WarningIcon color="error" />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.overallocatedCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Over-allocated Days
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Charts Section */}
      {stats && (utilizationPieData || technicianBarData) && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Utilization Categories Pie Chart */}
          {utilizationPieData && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Utilization Distribution
                </Typography>
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                  <Pie data={utilizationPieData} options={pieChartOptions} />
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Technician Utilization Bar Chart */}
          {technicianBarData && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Technician Utilization Comparison
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Bar data={technicianBarData} options={barChartOptions} />
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Technician Utilization Summary
            </Typography>
            
            <Box>
              {technicianSummary.length > 0 ? (
                <List>
                  {technicianSummary.map((summary, index) => (
                    <React.Fragment key={summary.technician.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle1" fontWeight="medium">
                                {summary.technician.firstName} {summary.technician.lastName}
                              </Typography>
                              <Chip
                                label={`${summary.averageUtilization}%`}
                                color={getUtilizationColor(summary.averageUtilization)}
                                size="small"
                                icon={
                                  summary.averageUtilization > 100 ? <WarningIcon /> :
                                  summary.averageUtilization >= 80 ? <CheckCircleIcon /> :
                                  <TrendingDownIcon />
                                }
                              />
                            </Stack>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                {summary.technician.department || 'No Department'} • 
                                {summary.scheduleCount} days • 
                                {summary.totalScheduled}h scheduled of {summary.totalAvailable}h available
                              </Typography>
                              
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(summary.averageUtilization, 100)}
                                color={getUtilizationColor(summary.averageUtilization)}
                                sx={{ mt: 1, height: 6, borderRadius: 1 }}
                              />
                              
                              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                <Typography variant="caption" color="success.main">
                                  Optimal: {summary.optimalDays}
                                </Typography>
                                <Typography variant="caption" color="warning.main">
                                  Under: {summary.underutilizedDays}
                                </Typography>
                                <Typography variant="caption" color="error.main">
                                  Over: {summary.overallocatedDays}
                                </Typography>
                              </Stack>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < technicianSummary.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No utilization data found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create schedules to see utilization metrics
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Utilization Categories */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Utilization Categories
              </Typography>
              
              {stats && (
                <Stack spacing={2}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2" color="success.main">
                        Optimal (80-100%)
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {stats.optimalCount}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={stats.totalSchedules > 0 ? (stats.optimalCount / stats.totalSchedules) * 100 : 0}
                      color="success"
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2" color="warning.main">
                        Under-utilized (&lt;80%)
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {stats.underutilizedCount}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={stats.totalSchedules > 0 ? (stats.underutilizedCount / stats.totalSchedules) * 100 : 0}
                      color="warning"
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2" color="error.main">
                        Over-allocated (&gt;100%)
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {stats.overallocatedCount}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={stats.totalSchedules > 0 ? (stats.overallocatedCount / stats.totalSchedules) * 100 : 0}
                      color="error"
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                </Stack>
              )}
            </Paper>

            {/* Quick Insights */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Insights
              </Typography>
              
              <Stack spacing={2}>
                {stats && stats.overallocatedCount > 0 && (
                  <Alert severity="error" variant="outlined">
                    <Typography variant="body2">
                      {stats.overallocatedCount} days are over-allocated. Consider redistributing workload.
                    </Typography>
                  </Alert>
                )}

                {stats && stats.underutilizedCount > stats.optimalCount && (
                  <Alert severity="warning" variant="outlined">
                    <Typography variant="body2">
                      High under-utilization detected. Consider assigning more work orders.
                    </Typography>
                  </Alert>
                )}

                {stats && stats.averageUtilization >= 80 && stats.averageUtilization <= 100 && (
                  <Alert severity="success" variant="outlined">
                    <Typography variant="body2">
                      Great! Average utilization is in the optimal range.
                    </Typography>
                  </Alert>
                )}

                {!stats && (
                  <Alert severity="info" variant="outlined">
                    <Typography variant="body2">
                      Select a date range to see utilization insights.
                    </Typography>
                  </Alert>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
} 