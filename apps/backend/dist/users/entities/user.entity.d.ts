import { WorkOrder } from '../../work-orders/entities/work-order.entity';
import { WorkOrderTimeEntry } from '../../work-orders/entities/work-order-time-entry.entity';
export declare enum UserRole {
    TECHNICIAN = "technician",
    ADMINISTRATOR = "administrator",
    REQUESTER = "requester",
    MANAGER = "manager"
}
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended"
}
export declare class User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    department?: string;
    role: UserRole;
    status: UserStatus;
    azureAdObjectId?: string;
    profilePictureUrl?: string;
    preferences?: string;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    assignedWorkOrders: WorkOrder[];
    timeEntries: WorkOrderTimeEntry[];
    get fullName(): string;
    get isActive(): boolean;
}
