import React, {createContext, useContext, useEffect, useState, ReactNode} from 'react';
import {User, AuthContextType, UserRole, UserStatus} from '../types';
import apiService from '../services/api';

// Declare global __DEV__ variable for React Native
declare const __DEV__: boolean;

// Mock MSAL for development - TODO: Replace with actual react-native-msal when configured
const mockMSAL = {
  getAccounts: async () => [],
  acquireTokenSilent: async (_request: any) => null,
  acquireTokenInteractive: async (_request: any) => null,
  removeAccount: async (_account: any) => {},
};

// MSAL Configuration - TODO: Configure when MSAL is set up
const msalConfig = {
  auth: {
    clientId: 'YOUR_CLIENT_ID', // TODO: Replace with actual client ID
    authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID', // TODO: Replace with actual tenant
  },
};

// Use mock MSAL for now - TODO: Replace with actual PublicClientApplication
const pca = mockMSAL;

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // For development, skip MSAL and use mock user
      if (__DEV__) {
        // Mock user for development
        const mockUser: User = {
          id: 'dev-user-1',
          email: 'technician@woms.dev',
          name: 'Dev Technician',
          role: UserRole.TECHNICIAN,
          status: UserStatus.ACTIVE,
          department: 'Maintenance',
          phoneNumber: '+1-555-0123',
          azureAdObjectId: 'dev-azure-id',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        setUser(mockUser);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // Production: Check if user is already signed in
      const accounts = await pca.getAccounts();
      if (accounts.length > 0) {
        // User is already signed in, get user info
        await getCurrentUser();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (): Promise<void> => {
    try {
      setIsLoading(true);

      if (__DEV__) {
        // Development mode - already handled in initializeAuth
        return;
      }

      // Production: Perform MSAL login
      const loginRequest = {
        scopes: ['openid', 'profile', 'email'],
      };

      const result = await pca.acquireTokenSilent(loginRequest);
      if (result) {
        await getCurrentUser();
      } else {
        // If silent login fails, try interactive login
        const interactiveResult = await pca.acquireTokenInteractive(loginRequest);
        if (interactiveResult) {
          await getCurrentUser();
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);

      if (__DEV__) {
        // Development mode - clear mock user
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      // Production: Perform MSAL logout
      const accounts = await pca.getAccounts();
      if (accounts.length > 0) {
        await pca.removeAccount(accounts[0]);
      }

      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentUser = async (): Promise<void> => {
    try {
      const userData = await apiService.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Get current user error:', error);
      // If API call fails, clear auth state
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 