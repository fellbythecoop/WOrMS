'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketProviderProps {
  children: ReactNode;
}

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  joinWorkOrderRoom: (workOrderId: string) => void;
  leaveWorkOrderRoom: (workOrderId: string) => void;
  joinScheduleRoom: (technicianId?: string, date?: string) => void;
  leaveScheduleRoom: (technicianId?: string, date?: string) => void;
  onScheduleUpdate: (callback: (data: any) => void) => () => void;
  onWorkOrderReassignment: (callback: (data: any) => void) => () => void;
  onScheduleConflict: (callback: (data: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;

    const connectSocket = () => {
      console.log('Attempting to connect to WebSocket...');
      
      // Initialize socket connection with more robust configuration
      const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
        transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
        timeout: 10000,
        retries: 3,
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 5,
        forceNew: true,
      });

      newSocket.on('connect', () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setConnectionError(null);
        setRetryCount(0);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setIsConnected(false);
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          newSocket.connect();
        }
      });

      newSocket.on('connect_error', (error) => {
        console.warn('WebSocket connection error:', error.message);
        setIsConnected(false);
        setConnectionError(`Connection failed: ${error.message}`);
        
        // Retry logic
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          reconnectTimeout = setTimeout(() => {
            console.log(`Retrying WebSocket connection (${retryCount + 1}/${maxRetries})...`);
            newSocket.connect();
          }, 5000 * (retryCount + 1)); // Exponential backoff
        } else {
          console.warn('Max WebSocket retry attempts reached. Operating in offline mode.');
          setConnectionError('Unable to connect to real-time services. Some features may be limited.');
        }
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
        setConnectionError(null);
        setRetryCount(0);
      });

      newSocket.on('reconnect_error', (error) => {
        console.warn('WebSocket reconnection error:', error);
      });

      setSocket(newSocket);
    };

    connectSocket();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const joinWorkOrderRoom = (workOrderId: string) => {
    if (socket?.connected) {
      socket.emit('joinWorkOrderRoom', { workOrderId });
      console.log(`Joined work order room: ${workOrderId}`);
    } else {
      console.warn('Cannot join work order room: WebSocket not connected');
    }
  };

  const leaveWorkOrderRoom = (workOrderId: string) => {
    if (socket?.connected) {
      socket.emit('leaveWorkOrderRoom', { workOrderId });
      console.log(`Left work order room: ${workOrderId}`);
    }
  };

  const joinScheduleRoom = (technicianId?: string, date?: string) => {
    if (socket?.connected) {
      socket.emit('joinScheduleRoom', { technicianId, date });
      console.log(`Joined schedule room - technician: ${technicianId}, date: ${date}`);
    } else {
      console.warn('Cannot join schedule room: WebSocket not connected');
    }
  };

  const leaveScheduleRoom = (technicianId?: string, date?: string) => {
    if (socket?.connected) {
      socket.emit('leaveScheduleRoom', { technicianId, date });
      console.log(`Left schedule room - technician: ${technicianId}, date: ${date}`);
    }
  };

  const onScheduleUpdate = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('scheduleUpdate', callback);
      return () => socket.off('scheduleUpdate', callback);
    }
    return () => {};
  };

  const onWorkOrderReassignment = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('workOrderReassignment', callback);
      return () => socket.off('workOrderReassignment', callback);
    }
    return () => {};
  };

  const onScheduleConflict = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('scheduleConflict', callback);
      return () => socket.off('scheduleConflict', callback);
    }
    return () => {};
  };

  const contextValue: WebSocketContextType = {
    socket,
    isConnected,
    connectionError,
    joinWorkOrderRoom,
    leaveWorkOrderRoom,
    joinScheduleRoom,
    leaveScheduleRoom,
    onScheduleUpdate,
    onWorkOrderReassignment,
    onScheduleConflict,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextType {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
} 