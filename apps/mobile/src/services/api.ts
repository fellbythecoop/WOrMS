import axios, {AxiosInstance, AxiosResponse} from 'axios';
import {
  WorkOrder,
  WorkOrderComment,
  WorkOrderAttachment,
  CreateCommentDto,
  UpdateWorkOrderStatusDto,
  User,
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://10.0.2.2:3001/api', // Android emulator URL (10.0.2.2 maps to host localhost)
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        // TODO: Add MSAL token here when authentication is implemented
        // const token = await getAccessToken();
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          // TODO: Implement logout/redirect logic
        }
        return Promise.reject(error);
      },
    );
  }

  // Work Orders
  async getMyWorkOrders(): Promise<WorkOrder[]> {
    const response: AxiosResponse<WorkOrder[]> = await this.api.get('/work-orders/my');
    return response.data;
  }

  async getWorkOrderById(id: string): Promise<WorkOrder> {
    const response: AxiosResponse<WorkOrder> = await this.api.get(`/work-orders/${id}`);
    return response.data;
  }

  async updateWorkOrderStatus(
    id: string,
    statusUpdate: UpdateWorkOrderStatusDto,
  ): Promise<WorkOrder> {
    const response: AxiosResponse<WorkOrder> = await this.api.put(
      `/work-orders/${id}/status`,
      statusUpdate,
    );
    return response.data;
  }

  // Comments
  async addComment(workOrderId: string, comment: CreateCommentDto): Promise<WorkOrderComment> {
    const response: AxiosResponse<WorkOrderComment> = await this.api.post(
      `/work-orders/${workOrderId}/comments`,
      comment,
    );
    return response.data;
  }

  // Attachments
  async uploadAttachment(
    workOrderId: string,
    file: FormData,
  ): Promise<WorkOrderAttachment> {
    const response: AxiosResponse<WorkOrderAttachment> = await this.api.post(
      `/work-orders/${workOrderId}/attachments`,
      file,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  }

  async downloadAttachment(attachmentId: string): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.api.get(
      `/work-orders/attachments/${attachmentId}/download`,
      {
        responseType: 'blob',
      },
    );
    return response.data;
  }

  // Users
  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/users/me');
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{status: string}> {
    const response: AxiosResponse<{status: string}> = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService; 