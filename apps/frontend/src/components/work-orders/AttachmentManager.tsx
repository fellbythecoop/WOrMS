import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  Paper,
  Grid,
  Tooltip,
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface Attachment {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  description?: string;
  createdAt: string;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface AttachmentManagerProps {
  workOrderId: string;
  attachments: Attachment[];
  onAttachmentAdded: (attachment: Attachment) => void;
  onAttachmentDeleted: (attachmentId: string) => void;
  canUpload?: boolean;
  canDelete?: boolean;
}

const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  workOrderId,
  attachments,
  onAttachmentAdded,
  onAttachmentDeleted,
  canUpload = true,
  canDelete = true,
}) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      if (description) {
        formData.append('description', description);
      }

      const response = await axios.post(
        `/api/work-orders/${workOrderId}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      onAttachmentAdded(response.data);
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDescription('');
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const response = await axios.get(
        `/api/work-orders/attachments/${attachment.id}/download`,
        {
          responseType: 'blob',
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Failed to download file. Please try again.');
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) {
      return;
    }

    try {
      await axios.delete(`/api/work-orders/attachments/${attachmentId}`);
      onAttachmentDeleted(attachmentId);
    } catch (err) {
      console.error('Error deleting attachment:', err);
      alert('Failed to delete attachment. Please try again.');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon />;
    } else if (mimeType === 'application/pdf') {
      return <PdfIcon />;
    } else {
      return <FileIcon />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" display="flex" alignItems="center" gap={1}>
          <AttachFileIcon />
          Attachments ({attachments.length})
        </Typography>
        {canUpload && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setUploadDialogOpen(true)}
            size="small"
          >
            Add Attachment
          </Button>
        )}
      </Box>

      {attachments.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <AttachFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography color="text.secondary">
            No attachments yet. {canUpload && 'Click "Add Attachment" to upload files.'}
          </Typography>
        </Paper>
      ) : (
        <List>
          {attachments.map((attachment) => (
            <ListItem
              key={attachment.id}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <Box display="flex" alignItems="center" gap={2} flex={1}>
                {getFileIcon(attachment.mimeType)}
                <Box flex={1}>
                  <Typography variant="subtitle2" fontWeight="medium">
                    {attachment.originalName}
                  </Typography>
                  <Box display="flex" gap={1} alignItems="center" mt={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(attachment.fileSize)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      •
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(attachment.createdAt)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      •
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {attachment.uploadedBy.firstName} {attachment.uploadedBy.lastName}
                    </Typography>
                  </Box>
                  {attachment.description && (
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                      {attachment.description}
                    </Typography>
                  )}
                </Box>
              </Box>
              <ListItemSecondaryAction>
                <Box display="flex" gap={1}>
                  <Tooltip title="Download">
                    <IconButton
                      size="small"
                      onClick={() => handleDownload(attachment)}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  {canDelete && (
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(attachment.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Attachment</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            
            <Button
              variant="outlined"
              component="label"
              startIcon={<AttachFileIcon />}
              fullWidth
              sx={{ height: 56 }}
            >
              {selectedFile ? selectedFile.name : 'Choose File'}
              <input
                type="file"
                hidden
                onChange={handleFileSelect}
                accept="*/*"
              />
            </Button>

            {selectedFile && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  File: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </Typography>
              </Box>
            )}

            <TextField
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Add a description for this attachment..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttachmentManager; 