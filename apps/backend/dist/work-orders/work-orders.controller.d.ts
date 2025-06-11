import { WorkOrdersService } from './work-orders.service';
import { WorkOrder, WorkOrderStatus } from './entities/work-order.entity';
export declare class WorkOrdersController {
    private readonly workOrdersService;
    constructor(workOrdersService: WorkOrdersService);
    findAll(status?: WorkOrderStatus, assignedTo?: string, priority?: string): Promise<WorkOrder[]>;
    findOne(id: string): Promise<WorkOrder>;
    create(createWorkOrderData: Partial<WorkOrder>): Promise<WorkOrder>;
    update(id: string, updateData: Partial<WorkOrder>): Promise<WorkOrder>;
    updateStatus(id: string, statusData: {
        status: WorkOrderStatus;
        completionNotes?: string;
    }): Promise<WorkOrder>;
    remove(id: string): Promise<void>;
    getDashboardStats(): Promise<{
        open: number;
        inProgress: number;
        completed: number;
        overdue: number;
        completedToday: number;
    }>;
    getOverdueWorkOrders(): Promise<WorkOrder[]>;
    addComment(id: string, commentData: {
        content: string;
        isInternal?: boolean;
        authorId: string;
    }): Promise<import("./entities/work-order-comment.entity").WorkOrderComment>;
    seedSampleWorkOrders(): Promise<WorkOrder[]>;
}
