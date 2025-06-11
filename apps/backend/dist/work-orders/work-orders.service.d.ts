import { Repository } from 'typeorm';
import { WorkOrder, WorkOrderStatus } from './entities/work-order.entity';
import { WorkOrderComment } from './entities/work-order-comment.entity';
import { WorkOrderAttachment } from './entities/work-order-attachment.entity';
export declare class WorkOrdersService {
    private readonly workOrderRepository;
    private readonly commentRepository;
    private readonly attachmentRepository;
    constructor(workOrderRepository: Repository<WorkOrder>, commentRepository: Repository<WorkOrderComment>, attachmentRepository: Repository<WorkOrderAttachment>);
    findAll(filters?: {
        status?: WorkOrderStatus;
        assignedTo?: string;
        priority?: string;
    }): Promise<WorkOrder[]>;
    findById(id: string): Promise<WorkOrder | null>;
    create(workOrderData: Partial<WorkOrder>): Promise<WorkOrder>;
    update(id: string, updateData: Partial<WorkOrder>): Promise<WorkOrder>;
    updateStatus(id: string, status: WorkOrderStatus, completionNotes?: string): Promise<WorkOrder>;
    delete(id: string): Promise<void>;
    findOverdue(): Promise<WorkOrder[]>;
    getDashboardStats(): Promise<{
        open: number;
        inProgress: number;
        completed: number;
        overdue: number;
        completedToday: number;
    }>;
    addComment(workOrderId: string, content: string, authorId: string, isInternal?: boolean): Promise<WorkOrderComment>;
    addAttachment(workOrderId: string, fileName: string, originalName: string, mimeType: string, fileSize: number, filePath: string, uploadedById: string, description?: string): Promise<WorkOrderAttachment>;
    seedSampleWorkOrders(): Promise<WorkOrder[]>;
    private generateWorkOrderNumber;
}
