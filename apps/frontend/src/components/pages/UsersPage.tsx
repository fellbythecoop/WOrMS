'use client';

import { Box, Typography, Container } from '@mui/material';
import UserManagement from '../users/UserManagement';

// Define enums to match backend
enum UserRole {
  TECHNICIAN = 'technician',
  ADMINISTRATOR = 'administrator',
  REQUESTER = 'requester',
  MANAGER = 'manager',
}

export function UsersPage() {
  // Mock current user for development (in production this would come from auth context)
  const currentUser = {
    id: 'dev-user-1',
    email: 'developer@company.com',
    firstName: 'Dev',
    lastName: 'User',
    role: UserRole.ADMINISTRATOR,
    status: 'active',
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          User Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage user accounts, roles, and permissions
        </Typography>
      </Box>

      <UserManagement currentUserRole={currentUser.role as UserRole} />
    </Container>
  );
} 