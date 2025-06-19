import { WorkOrder } from './work-order.entity';
import { User } from '../../users/entities/user.entity';
export declare enum TimeEntryType {
    TRAVEL_TIME = "travel_time",
    STRAIGHT_TIME = "straight_time",
    OVERTIME = "overtime",
    DOUBLE_TIME = "double_time"
}
export declare class WorkOrderTimeEntry {
    id: string;
    timeEntryType: TimeEntryType;
    hours: number;
    rate: number;
    totalAmount: number;
    description?: string;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
    workOrder: WorkOrder;
    workOrderId: string;
    technician: User;
    technicianId: string;
}
