import { User } from '../../users/entities/user.entity';
import { Asset } from '../../assets/entities/asset.entity';
import { WorkOrderComment } from './work-order-comment.entity';
import { WorkOrderAttachment } from './work-order-attachment.entity';
export declare enum WorkOrderStatus {
    OPEN = "open",
    IN_PROGRESS = "in_progress",
    PENDING = "pending",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    CLOSED = "closed"
}
export declare enum WorkOrderPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum WorkOrderType {
    MAINTENANCE = "maintenance",
    REPAIR = "repair",
    INSPECTION = "inspection",
    INSTALLATION = "installation",
    EMERGENCY = "emergency"
}
export declare class WorkOrder {
    id: string;
    workOrderNumber: string;
    title: string;
    description: string;
    status: WorkOrderStatus;
    priority: WorkOrderPriority;
    type: WorkOrderType;
    estimatedHours?: number;
    actualHours?: number;
    estimatedCost?: number;
    actualCost?: number;
    scheduledStartDate?: Date;
    scheduledEndDate?: Date;
    actualStartDate?: Date;
    actualEndDate?: Date;
    completionNotes?: string;
    signature?: string;
    metadata?: string;
    createdAt: Date;
    updatedAt: Date;
    requestedBy: User;
    requestedById: string;
    assignedTo?: User;
    assignedToId?: string;
    asset?: Asset;
    assetId?: string;
    comments: WorkOrderComment[];
    attachments: WorkOrderAttachment[];
    get isOverdue(): boolean;
    get daysOverdue(): number;
    get duration(): number | null;
}
