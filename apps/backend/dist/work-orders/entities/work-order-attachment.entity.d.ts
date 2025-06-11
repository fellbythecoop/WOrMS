import { User } from '../../users/entities/user.entity';
import { WorkOrder } from './work-order.entity';
export declare class WorkOrderAttachment {
    id: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    filePath: string;
    description?: string;
    createdAt: Date;
    workOrder: WorkOrder;
    workOrderId: string;
    uploadedBy: User;
    uploadedById: string;
}
