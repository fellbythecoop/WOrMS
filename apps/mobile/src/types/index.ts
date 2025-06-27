export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  phoneNumber?: string;
  azureAdObjectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  TECHNICIAN = 'TECHNICIAN',
  ADMINISTRATOR = 'ADMINISTRATOR',
  REQUESTER = 'REQUESTER',
  MANAGER = 'MANAGER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface WorkOrder {
  id: string;
  workOrderNumber: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  type: WorkOrderType;
  requestedBy: User;
  requestedById: string;
  assignedTo?: User;
  assignedToId?: string;
  asset?: Asset;
  assetId?: string;
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  estimatedHours?: number;
  estimatedCost?: number;
  actualHours?: number;
  actualCost?: number;
  scheduledStartDate?: Date;
  scheduledCompletionDate?: Date;
  actualStartDate?: Date;
  actualCompletionDate?: Date;
  completionNotes?: string;
  signature?: string;
  createdAt: Date;
  updatedAt: Date;
  comments: WorkOrderComment[];
  attachments: WorkOrderAttachment[];
}

export enum WorkOrderStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum WorkOrderPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum WorkOrderType {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
  EMERGENCY = 'EMERGENCY',
  INSPECTION = 'INSPECTION',
  INSTALLATION = 'INSTALLATION',
  UPGRADE = 'UPGRADE',
}

export interface Asset {
  id: string;
  name: string;
  description?: string;
  category: AssetCategory;
  status: AssetStatus;
  location?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  purchaseDate?: Date;
  warrantyExpiryDate?: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  purchaseCost?: number;
  currentValue?: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum AssetCategory {
  EQUIPMENT = 'EQUIPMENT',
  FACILITY = 'FACILITY',
  VEHICLE = 'VEHICLE',
  IT = 'IT',
  FURNITURE = 'FURNITURE',
  OTHER = 'OTHER',
}

export enum AssetStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED',
}

export interface WorkOrderComment {
  id: string;
  content: string;
  isInternal: boolean;
  author: User;
  authorId: string;
  workOrderId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrderAttachment {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  description?: string;
  uploadedBy: User;
  uploadedById: string;
  workOrderId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCommentDto {
  content: string;
  isInternal: boolean;
}

export interface UpdateWorkOrderStatusDto {
  status: WorkOrderStatus;
  completionNotes?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
} 