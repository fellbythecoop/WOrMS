'use client';

import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Work as WorkIcon,
  People as PeopleIcon,
  Build as BuildIcon,
  Menu as MenuIcon,
  PictureAsPdf as ReportsIcon,
  Business as BusinessIcon,
  CalendarMonth as SchedulingIcon,
} from '@mui/icons-material';

export type NavigationPage = 'dashboard' | 'work-orders' | 'users' | 'assets' | 'reports' | 'customers' | 'scheduling';

interface NavigationProps {
  currentPage: NavigationPage;
  onPageChange: (page: NavigationPage) => void;
  isAdmin?: boolean;
}

export function Navigation({ currentPage, onPageChange, isAdmin = false }: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const navigationItems = [
    {
      id: 'dashboard' as NavigationPage,
      label: 'Dashboard',
      icon: <DashboardIcon />,
      show: true,
    },
    {
      id: 'work-orders' as NavigationPage,
      label: 'Work Orders',
      icon: <WorkIcon />,
      show: true,
    },
    {
      id: 'scheduling' as NavigationPage,
      label: 'Scheduling',
      icon: <SchedulingIcon />,
      show: true,
    },
    {
      id: 'assets' as NavigationPage,
      label: 'Assets',
      icon: <BuildIcon />,
      show: true,
    },
    {
      id: 'customers' as NavigationPage,
      label: 'Customers',
      icon: <BusinessIcon />,
      show: true,
    },
    {
      id: 'reports' as NavigationPage,
      label: 'Reports',
      icon: <ReportsIcon />,
      show: true,
    },
    {
      id: 'users' as NavigationPage,
      label: 'User Management',
      icon: <PeopleIcon />,
      show: isAdmin,
    },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handlePageChange = (page: NavigationPage) => {
    onPageChange(page);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          WOMS
        </Typography>
      </Toolbar>
      <List>
        {navigationItems
          .filter(item => item.show)
          .map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                selected={currentPage === item.id}
                onClick={() => handlePageChange(item.id)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Work Order Management System
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {navigationItems
                .filter(item => item.show)
                .map((item) => (
                  <Button
                    key={item.id}
                    color="inherit"
                    startIcon={item.icon}
                    onClick={() => handlePageChange(item.id)}
                    sx={{
                      backgroundColor: currentPage === item.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
} 