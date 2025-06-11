import { User } from '../../users/entities/user.entity';
import { WorkOrder } from './work-order.entity';
export declare class WorkOrderComment {
    id: string;
    content: string;
    isInternal: boolean;
    createdAt: Date;
    workOrder: WorkOrder;
    workOrderId: string;
    author: User;
    authorId: string;
}
