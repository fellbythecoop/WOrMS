'use client';

import { ReactNode } from 'react';

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  // This will be implemented with WebSocket connection logic
  // For now, just pass through the children
  return <>{children}</>;
} 