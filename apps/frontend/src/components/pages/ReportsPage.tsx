'use client';

import { useState } from 'react';
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
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  Work as WorkIcon,
  Build as BuildIcon,
  Dashboard as DashboardIcon,
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
  params?: {
    workOrderId?: string;
    signature?: string;
    completionNotes?: string;
  };
}

export function ReportsPage() {
  const { showSuccess, showError } = useNotificationHelpers();
  const [loading, setLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [formData, setFormData] = useState({
    workOrderId: '',
    signature: '',
    completionNotes: '',
  });

  const reportTypes: ReportType[] = [
    {
      id: 'work-order',
      title: 'Work Order Report',
      description: 'Generate a detailed PDF report for a specific work order',
      icon: <WorkIcon />,
      endpoint: '/api/reports/work-order',
      requiresParams: true,
    },
    {
      id: 'completion',
      title: 'Completion Report',
      description: 'Generate a completion report with signature and notes',
      icon: <WorkIcon />,
      endpoint: '/api/reports/work-order',
      requiresParams: true,
    },
    {
      id: 'maintenance-schedule',
      title: 'Maintenance Schedule',
      description: 'Generate a report of assets due for maintenance',
      icon: <BuildIcon />,
      endpoint: '/api/reports/assets/maintenance-schedule',
    },
    {
      id: 'dashboard-summary',
      title: 'Dashboard Summary',
      description: 'Generate a comprehensive dashboard summary report',
      icon: <DashboardIcon />,
      endpoint: '/api/reports/dashboard/summary',
    },
  ];

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

      if (report.id === 'work-order' && params?.workOrderId) {
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
      link.download = `${report.id}-report.pdf`;
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
          Reports
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Generate PDF reports for work orders, assets, and system summaries
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {reportTypes.map((report) => (
          <Grid item xs={12} sm={6} md={4} key={report.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <PdfIcon color="primary" />
                  <Typography variant="h6" component="h2">
                    {report.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {report.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  startIcon={loading === report.id ? <CircularProgress size={20} /> : <DownloadIcon />}
                  onClick={() => handleGenerateReport(report)}
                  disabled={loading === report.id}
                  fullWidth
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
          Generate {selectedReport?.title}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {selectedReport?.id === 'work-order' && (
              <TextField
                fullWidth
                label="Work Order ID"
                value={formData.workOrderId}
                onChange={(e) => setFormData({ ...formData, workOrderId: e.target.value })}
                margin="normal"
                required
                helperText="Enter the work order ID to generate the report"
              />
            )}

            {selectedReport?.id === 'completion' && (
              <>
                <TextField
                  fullWidth
                  label="Work Order ID"
                  value={formData.workOrderId}
                  onChange={(e) => setFormData({ ...formData, workOrderId: e.target.value })}
                  margin="normal"
                  required
                  helperText="Enter the work order ID to generate the completion report"
                />
                
                <TextField
                  fullWidth
                  label="Signature"
                  value={formData.signature}
                  onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                  margin="normal"
                  placeholder="Digital Signature"
                  helperText="Enter the technician's signature or leave blank for default"
                />
                
                <TextField
                  fullWidth
                  label="Completion Notes"
                  value={formData.completionNotes}
                  onChange={(e) => setFormData({ ...formData, completionNotes: e.target.value })}
                  margin="normal"
                  multiline
                  rows={3}
                  placeholder="Describe the work completed, parts used, and any additional notes"
                  helperText="Optional completion notes to include in the report"
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleDialogSubmit} 
            variant="contained"
            disabled={!formData.workOrderId && selectedReport?.requiresParams}
          >
            Generate Report
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 