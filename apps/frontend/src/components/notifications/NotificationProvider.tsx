'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Snackbar, Alert, AlertColor, Slide, SlideProps } from '@mui/material';

interface Notification {
  id: string;
  message: string;
  type: AlertColor;
  duration?: number;
  timestamp: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (message: string, type?: AlertColor, duration?: number) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="down" />;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);

  const showNotification = useCallback((
    message: string, 
    type: AlertColor = 'info', 
    duration: number = 6000
  ) => {
    const notification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      type,
      duration,
      timestamp: new Date(),
    };

    setNotifications(prev => [...prev, notification]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setCurrentNotification(null);
  }, []);

  // Show notifications one by one
  useEffect(() => {
    if (notifications.length > 0 && !currentNotification) {
      const [nextNotification, ...rest] = notifications;
      setCurrentNotification(nextNotification);
      setNotifications(rest);
    }
  }, [notifications, currentNotification]);

  const handleClose = () => {
    setCurrentNotification(null);
  };

  const contextValue: NotificationContextType = {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Notification Display */}
      {currentNotification && (
        <Snackbar
          open={true}
          autoHideDuration={currentNotification.duration || 6000}
          onClose={handleClose}
          TransitionComponent={SlideTransition}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ 
            mt: 8, // Account for app bar height
            '& .MuiSnackbar-root': {
              position: 'fixed',
            }
          }}
        >
          <Alert 
            onClose={handleClose} 
            severity={currentNotification.type}
            variant="filled"
            sx={{ 
              minWidth: '300px',
              '& .MuiAlert-message': {
                wordBreak: 'break-word',
              }
            }}
          >
            {currentNotification.message}
          </Alert>
        </Snackbar>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Convenience hooks for specific notification types
export function useNotificationHelpers() {
  const { showNotification } = useNotifications();

  const showSuccess = useCallback((message: string, duration?: number) => {
    showNotification(message, 'success', duration);
  }, [showNotification]);

  const showError = useCallback((message: string, duration?: number) => {
    showNotification(message, 'error', duration || 8000);
  }, [showNotification]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showNotification(message, 'warning', duration);
  }, [showNotification]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showNotification(message, 'info', duration);
  }, [showNotification]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
} 