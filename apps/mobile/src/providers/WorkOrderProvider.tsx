import React, {createContext, useContext, useState, ReactNode} from 'react';
import {WorkOrder, WorkOrderStatus, CreateCommentDto, UpdateWorkOrderStatusDto} from '../types';
import apiService from '../services/api';

// Declare global __DEV__ variable for React Native
declare const __DEV__: boolean;

interface WorkOrderContextType {
  workOrders: WorkOrder[];
  selectedWorkOrder: WorkOrder | null;
  isLoading: boolean;
  error: string | null;
  fetchMyWorkOrders: () => Promise<void>;
  fetchWorkOrderById: (id: string) => Promise<void>;
  updateWorkOrderStatus: (id: string, statusUpdate: UpdateWorkOrderStatusDto) => Promise<void>;
  addComment: (workOrderId: string, comment: CreateCommentDto) => Promise<void>;
  uploadAttachment: (workOrderId: string, file: FormData) => Promise<void>;
  clearError: () => void;
  refreshWorkOrder: (id: string) => Promise<void>;
}

const WorkOrderContext = createContext<WorkOrderContextType | undefined>(undefined);

interface WorkOrderProviderProps {
  children: ReactNode;
}

export const WorkOrderProvider: React.FC<WorkOrderProviderProps> = ({children}) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const fetchMyWorkOrders = async (): Promise<void> => {
    try {
      setIsLoading(true);
      clearError();
      
      // For development, use mock data
      if (__DEV__) {
        const mockWorkOrders: WorkOrder[] = [
          {
            id: 'wo-1',
            workOrderNumber: 'WO-2024-001',
            title: 'Fix HVAC System',
            description: 'Air conditioning not working in conference room A',
            status: WorkOrderStatus.ASSIGNED,
            priority: 'HIGH' as any,
            type: 'CORRECTIVE' as any,
            requestedBy: {
              id: 'user-1',
              email: 'requester@woms.dev',
              name: 'John Requester',
              role: 'REQUESTER' as any,
              status: 'ACTIVE' as any,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            requestedById: 'user-1',
            assignedTo: {
              id: 'dev-user-1',
              email: 'technician@woms.dev',
              name: 'Dev Technician',
              role: 'TECHNICIAN' as any,
              status: 'ACTIVE' as any,
              department: 'Maintenance',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            assignedToId: 'dev-user-1',
            customerName: 'ABC Corporation',
            customerAddress: '123 Business St, City, State 12345',
            customerPhone: '+1-555-0100',
            customerEmail: 'contact@abc-corp.com',
            estimatedHours: 4,
            estimatedCost: 500,
            scheduledStartDate: new Date(),
            scheduledCompletionDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            createdAt: new Date(),
            updatedAt: new Date(),
            comments: [],
            attachments: [],
          },
        ];
        
        setWorkOrders(mockWorkOrders);
        return;
      }

      const data = await apiService.getMyWorkOrders();
      setWorkOrders(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch work orders';
      setError(errorMessage);
      console.error('Fetch work orders error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkOrderById = async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      clearError();

      if (__DEV__) {
        await fetchMyWorkOrders();
        const mockWorkOrder = workOrders.find(wo => wo.id === id);
        if (mockWorkOrder) {
          setSelectedWorkOrder(mockWorkOrder);
        } else {
          setError('Work order not found');
        }
        return;
      }

      const data = await apiService.getWorkOrderById(id);
      setSelectedWorkOrder(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch work order';
      setError(errorMessage);
      console.error('Fetch work order error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateWorkOrderStatus = async (
    id: string,
    statusUpdate: UpdateWorkOrderStatusDto,
  ): Promise<void> => {
    try {
      setIsLoading(true);
      clearError();

      if (__DEV__) {
        setWorkOrders(prev =>
          prev.map(wo =>
            wo.id === id
              ? {
                  ...wo,
                  status: statusUpdate.status,
                  completionNotes: statusUpdate.completionNotes || wo.completionNotes,
                  actualCompletionDate:
                    statusUpdate.status === WorkOrderStatus.COMPLETED
                      ? new Date()
                      : wo.actualCompletionDate,
                  updatedAt: new Date(),
                }
              : wo,
          ),
        );

        if (selectedWorkOrder?.id === id) {
          setSelectedWorkOrder(prev =>
            prev
              ? {
                  ...prev,
                  status: statusUpdate.status,
                  completionNotes: statusUpdate.completionNotes || prev.completionNotes,
                  actualCompletionDate:
                    statusUpdate.status === WorkOrderStatus.COMPLETED
                      ? new Date()
                      : prev.actualCompletionDate,
                  updatedAt: new Date(),
                }
              : null,
          );
        }
        return;
      }

      const updatedWorkOrder = await apiService.updateWorkOrderStatus(id, statusUpdate);
      setWorkOrders(prev => prev.map(wo => (wo.id === id ? updatedWorkOrder : wo)));
      
      if (selectedWorkOrder?.id === id) {
        setSelectedWorkOrder(updatedWorkOrder);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update work order status';
      setError(errorMessage);
      console.error('Update work order status error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addComment = async (workOrderId: string, comment: CreateCommentDto): Promise<void> => {
    try {
      setIsLoading(true);
      clearError();

      if (__DEV__) {
        console.log('Mock add comment for work order:', workOrderId, comment);
        return;
      }

      await apiService.addComment(workOrderId, comment);
      await refreshWorkOrder(workOrderId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add comment';
      setError(errorMessage);
      console.error('Add comment error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadAttachment = async (workOrderId: string, file: FormData): Promise<void> => {
    try {
      setIsLoading(true);
      clearError();

      if (__DEV__) {
        console.log('Mock file upload for work order:', workOrderId);
        return;
      }

      await apiService.uploadAttachment(workOrderId, file);
      await refreshWorkOrder(workOrderId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload attachment';
      setError(errorMessage);
      console.error('Upload attachment error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWorkOrder = async (id: string): Promise<void> => {
    if (selectedWorkOrder?.id === id) {
      await fetchWorkOrderById(id);
    }
  };

  const contextValue: WorkOrderContextType = {
    workOrders,
    selectedWorkOrder,
    isLoading,
    error,
    fetchMyWorkOrders,
    fetchWorkOrderById,
    updateWorkOrderStatus,
    addComment,
    uploadAttachment,
    clearError,
    refreshWorkOrder,
  };

  return (
    <WorkOrderContext.Provider value={contextValue}>
      {children}
    </WorkOrderContext.Provider>
  );
};

export const useWorkOrders = (): WorkOrderContextType => {
  const context = useContext(WorkOrderContext);
  if (context === undefined) {
    throw new Error('useWorkOrders must be used within a WorkOrderProvider');
  }
  return context;
}; 