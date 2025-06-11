'use client';

import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // This will be implemented with proper authentication logic
  // For now, just pass through the children
  return <>{children}</>;
} 