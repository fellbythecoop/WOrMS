'use client';

import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';

export function SimpleDashboard() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Work Order Management System
      </Typography>
      
      <Grid container spacing={3}>
        {/* Overview Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Open Work Orders
              </Typography>
              <Typography variant="h4">
                12
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                In Progress
              </Typography>
              <Typography variant="h4">
                8
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Completed Today
              </Typography>
              <Typography variant="h4">
                5
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Overdue
              </Typography>
              <Typography variant="h4" color="error">
                3
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Simple Work Orders Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Work Orders
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Work order management interface will be loaded here.
              </Typography>
              <Button variant="contained" color="primary">
                Create New Work Order
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 