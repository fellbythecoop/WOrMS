'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  Work as WorkIcon,
  Build as BuildIcon,
  Dashboard as DashboardIcon,
  Preview as PreviewIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Engineering as EngineeringIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useNotificationHelpers } from '../notifications/NotificationProvider';
import axios from 'axios';

interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  endpoint: string;
  requiresParams?: boolean;
  features: string[];
  badge?: string;
  params?: {
    workOrderId?: string;
    signature?: string;
    completionNotes?: string;
  };
}

interface WorkOrder {
  id: string;
  workOrderNumber: string;
  title: string;
  status: string;
}

export function ReportsPage() {
  const { showSuccess, showError } = useNotificationHelpers();
  const [loading, setLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [formData, setFormData] = useState({
    workOrderId: '',
    signature: '',
    completionNotes: '',
  });

  const reportTypes: ReportType[] = [
    {
      id: 'professional-work-order',
      title: 'Professional Work Order Report',
      description: 'Modern, comprehensive work order report with professional layout and detailed sections',
      icon: <WorkIcon />,
      endpoint: '/api/reports/work-order',
      requiresParams: true,
      badge: 'NEW',
      features: [
        'Professional header with company branding',
        'Comprehensive work order information grid',
        'Personnel and customer details',
        'Time tracking with cost analysis',
        'Work performed documentation',
        'Parts and materials section',
        'Signature and authorization section',
        'Comments and attachments listing',
      ],
    },
    {
      id: 'completion',
      title: 'Work Order Completion Report',
      description: 'Generate a completion report with signature and completion notes',
      icon: <CheckIcon />,
      endpoint: '/api/reports/work-order',
      requiresParams: true,
      features: [
        'Completion certification',
        'Digital signature capture',
        'Completion notes and observations',
        'Time and cost summary',
      ],
    },
    {
      id: 'maintenance-schedule',
      title: 'Asset Maintenance Schedule',
      description: 'Comprehensive report of assets due for maintenance with schedules',
      icon: <ScheduleIcon />,
      endpoint: '/api/reports/assets/maintenance-schedule',
      features: [
        'Asset maintenance schedules',
        'Due date tracking',
        'Maintenance history',
        'Asset condition reports',
      ],
    },
    {
      id: 'dashboard-summary',
      title: 'Dashboard Summary Report',
      description: 'Executive summary with key metrics and performance indicators',
      icon: <DashboardIcon />,
      endpoint: '/api/reports/dashboard/summary',
      features: [
        'Key performance indicators',
        'Work order statistics',
        'Asset utilization metrics',
        'Technician performance',
      ],
    },
  ];

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      const response = await axios.get('/api/work-orders');
      setWorkOrders(response.data.workOrders || []);
    } catch (error) {
      console.error('Error fetching work orders:', error);
    }
  };

  const handleGenerateReport = async (report: ReportType) => {
    if (report.requiresParams) {
      setSelectedReport(report);
      setDialogOpen(true);
      return;
    }

    await generateReport(report);
  };

  const generateReport = async (report: ReportType, params?: any) => {
    try {
      setLoading(report.id);
      
      let url = report.endpoint;
      let method = 'GET';
      let data = null;

      if ((report.id === 'work-order' || report.id === 'professional-work-order') && params?.workOrderId) {
        url = `${report.endpoint}/${params.workOrderId}/pdf`;
      } else if (report.id === 'completion' && params?.workOrderId) {
        url = `${report.endpoint}/${params.workOrderId}/complete`;
        method = 'POST';
        data = {
          signature: params.signature || 'Digital Signature',
          completionNotes: params.completionNotes,
        };
      }

      const response = await axios({
        method,
        url,
        data,
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url2 = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url2;
      
      // Get work order number for filename if available
      const workOrder = workOrders.find(wo => wo.id === params?.workOrderId);
      const workOrderNumber = workOrder?.workOrderNumber || params?.workOrderId || 'report';
      link.download = `${report.title.replace(/\s+/g, '-').toLowerCase()}-${workOrderNumber}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url2);

      showSuccess(`${report.title} generated successfully!`);
    } catch (error) {
      console.error('Error generating report:', error);
      showError('Failed to generate report. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleDialogSubmit = () => {
    if (!selectedReport) return;

    generateReport(selectedReport, formData);
    setDialogOpen(false);
    setSelectedReport(null);
    setFormData({ workOrderId: '', signature: '', completionNotes: '' });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedReport(null);
    setFormData({ workOrderId: '', signature: '', completionNotes: '' });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Professional Reports
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" mb={2}>
          Generate professional PDF reports with modern design and comprehensive information
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>New Professional Work Order Report:</strong> We've completely redesigned our work order reports 
            with a modern, professional layout that includes all essential information in an organized, 
            easy-to-read format.
          </Typography>
        </Alert>
      </Box>

      <Grid container spacing={3}>
        {reportTypes.map((report) => (
          <Grid item xs={12} lg={6} key={report.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Box sx={{ color: 'primary.main' }}>
                    {report.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" component="h2">
                        {report.title}
                      </Typography>
                      {report.badge && (
                        <Chip 
                          label={report.badge} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {report.description}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom color="primary">
                  Features Include:
                </Typography>
                <List dense>
                  {report.features.slice(0, 4).map((feature, index) => (
                    <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <CheckIcon color="success" sx={{ fontSize: 16 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature} 
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                  {report.features.length > 4 && (
                    <ListItem sx={{ py: 0.5, px: 0 }}>
                      <ListItemText 
                        primary={`+ ${report.features.length - 4} more features`}
                        primaryTypographyProps={{ 
                          variant: 'body2', 
                          color: 'text.secondary',
                          fontStyle: 'italic' 
                        }}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
              
              <CardActions>
                <Button
                  variant="contained"
                  startIcon={loading === report.id ? <CircularProgress size={20} /> : <DownloadIcon />}
                  onClick={() => handleGenerateReport(report)}
                  disabled={loading === report.id}
                  fullWidth
                  sx={{ 
                    backgroundColor: report.badge ? 'primary.main' : undefined,
                    '&:hover': {
                      backgroundColor: report.badge ? 'primary.dark' : undefined,
                    }
                  }}
                >
                  {loading === report.id ? 'Generating...' : 'Generate Report'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Report Parameters Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <PdfIcon color="primary" />
            Generate {selectedReport?.title}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {(selectedReport?.id === 'work-order' || selectedReport?.id === 'professional-work-order') && (
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Work Order</InputLabel>
                <Select
                  value={formData.workOrderId}
                  onChange={(e) => setFormData({ ...formData, workOrderId: e.target.value })}
                  label="Work Order"
                >
                  {workOrders.map((workOrder) => (
                    <MenuItem key={workOrder.id} value={workOrder.id}>
                      <Box>
                        <Typography variant="body1">
                          {workOrder.workOrderNumber} - {workOrder.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Status: {workOrder.status}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {selectedReport?.id === 'completion' && (
              <>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Work Order</InputLabel>
                  <Select
                    value={formData.workOrderId}
                    onChange={(e) => setFormData({ ...formData, workOrderId: e.target.value })}
                    label="Work Order"
                  >
                    {workOrders.filter(wo => wo.status === 'completed').map((workOrder) => (
                      <MenuItem key={workOrder.id} value={workOrder.id}>
                        <Box>
                          <Typography variant="body1">
                            {workOrder.workOrderNumber} - {workOrder.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Status: {workOrder.status}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  label="Technician Signature"
                  value={formData.signature}
                  onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                  margin="normal"
                  placeholder="Enter technician name or digital signature"
                  helperText="This will appear in the signature section of the report"
                />
                
                <TextField
                  fullWidth
                  label="Completion Notes"
                  value={formData.completionNotes}
                  onChange={(e) => setFormData({ ...formData, completionNotes: e.target.value })}
                  margin="normal"
                  multiline
                  rows={4}
                  placeholder="Describe the work completed, parts used, any issues encountered, and recommendations for future maintenance..."
                  helperText="Optional detailed notes about the completion of this work order"
                />
              </>
            )}

            {selectedReport?.badge === 'NEW' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Professional Report Features:</strong> This new report includes enhanced 
                  formatting, comprehensive sections, time tracking details, and a modern professional layout.
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleDialogSubmit} 
            variant="contained"
            disabled={!formData.workOrderId && selectedReport?.requiresParams}
            startIcon={<DownloadIcon />}
          >
            Generate Report
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 