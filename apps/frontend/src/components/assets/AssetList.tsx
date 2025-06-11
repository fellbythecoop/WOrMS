'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Alert,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import axios from 'axios';

// Types matching backend
export enum AssetStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
}

export enum AssetCategory {
  EQUIPMENT = 'equipment',
  FACILITY = 'facility',
  VEHICLE = 'vehicle',
  IT = 'it',
  FURNITURE = 'furniture',
  OTHER = 'other',
}

interface Asset {
  id: string;
  assetNumber: string;
  name: string;
  description?: string;
  category: AssetCategory;
  status: AssetStatus;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  location?: string;
  department?: string;
  purchasePrice?: number;
  purchaseDate?: Date;
  warrantyExpiration?: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  isUnderWarranty: boolean;
  isMaintenanceDue: boolean;
  age: number;
}

interface AssetListProps {
  onCreateNew: () => void;
  onEdit: (asset: Asset) => void;
  onView: (asset: Asset) => void;
  onDelete: (assetId: string) => void;
}

const statusColors: Record<AssetStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  [AssetStatus.ACTIVE]: 'success',
  [AssetStatus.INACTIVE]: 'default',
  [AssetStatus.MAINTENANCE]: 'warning',
  [AssetStatus.RETIRED]: 'error',
};

const categoryColors: Record<AssetCategory, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  [AssetCategory.EQUIPMENT]: 'primary',
  [AssetCategory.FACILITY]: 'secondary',
  [AssetCategory.VEHICLE]: 'info',
  [AssetCategory.IT]: 'success',
  [AssetCategory.FURNITURE]: 'warning',
  [AssetCategory.OTHER]: 'default',
};

export function AssetList({ onCreateNew, onEdit, onView, onDelete }: AssetListProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [assets, searchQuery, statusFilter, categoryFilter, locationFilter]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/assets');
      setAssets(response.data);
    } catch (err) {
      setError('Failed to fetch assets');
      console.error('Error fetching assets:', err);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = [...assets];

    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.assetNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.model?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(asset => asset.status === statusFilter);
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(asset => asset.category === categoryFilter);
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(asset => 
        asset.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    setFilteredAssets(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setCategoryFilter('');
    setLocationFilter('');
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return 'N/A';
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const columns: GridColDef[] = [
    {
      field: 'assetNumber',
      headerName: 'Asset #',
      width: 130,
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.manufacturer} {params.row.model}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value.toUpperCase()}
          color={categoryColors[params.value as AssetCategory]}
          size="small"
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value.toUpperCase()}
          color={statusColors[params.value as AssetStatus]}
          size="small"
        />
      ),
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 150,
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 120,
    },
    {
      field: 'purchasePrice',
      headerName: 'Value',
      width: 100,
      renderCell: (params: GridRenderCellParams) => formatCurrency(params.value),
    },
    {
      field: 'isMaintenanceDue',
      headerName: 'Maintenance',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        params.value ? (
          <Chip label="DUE" color="warning" size="small" />
        ) : (
          <Chip label="OK" color="success" size="small" />
        )
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" gap={1}>
          <Button
            size="small"
            startIcon={<ViewIcon />}
            onClick={() => onView(params.row)}
          >
            View
          </Button>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => onEdit(params.row)}
          >
            Edit
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Asset Management</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateNew}
          >
            Add New Asset
          </Button>
        </Box>

        {/* Filters */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                {Object.values(AssetStatus).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All</MenuItem>
                {Object.values(AssetCategory).map((category) => (
                  <MenuItem key={category} value={category}>
                    {category.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button onClick={clearFilters}>Clear Filters</Button>
            <Button onClick={fetchAssets} disabled={loading} sx={{ ml: 1 }}>
              Refresh
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Data Grid */}
        <Box height={400}>
          <DataGrid
            rows={filteredAssets}
            columns={columns}
            loading={loading}
            pagination
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            disableRowSelectionOnClick
          />
        </Box>

        {/* Summary */}
        <Box mt={2} display="flex" gap={2} flexWrap="wrap">
          <Typography variant="body2" color="text.secondary">
            Total Assets: {filteredAssets.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Active: {filteredAssets.filter(a => a.status === AssetStatus.ACTIVE).length}
          </Typography>
          <Typography variant="body2" color="warning.main">
            Maintenance Due: {filteredAssets.filter(a => a.isMaintenanceDue).length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Under Warranty: {filteredAssets.filter(a => a.isUnderWarranty).length}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
} 