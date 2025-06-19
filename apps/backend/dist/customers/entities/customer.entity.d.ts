import { WorkOrder } from '../../work-orders/entities/work-order.entity';
export declare class Customer {
    id: string;
    name: string;
    address?: string;
    primaryContactName?: string;
    primaryContactPhone?: string;
    primaryContactEmail?: string;
    secondaryContactName?: string;
    secondaryContactPhone?: string;
    secondaryContactEmail?: string;
    notes?: string;
    travelTimeRate: number;
    straightTimeRate: number;
    overtimeRate: number;
    doubleTimeRate: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    workOrders: WorkOrder[];
}
