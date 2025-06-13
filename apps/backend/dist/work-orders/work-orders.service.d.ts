import { Repository } from 'typeorm';
import { WorkOrder, WorkOrderStatus } from './entities/work-order.entity';
import { WorkOrderComment } from './entities/work-order-comment.entity';
import { WorkOrderAttachment } from './entities/work-order-attachment.entity';
import { CacheService } from '../cache/cache.service';
export interface DashboardStats {
    open: number;
    inProgress: number;
    completed: number;
    overdue: number;
    completedToday: number;
}
export declare class WorkOrdersService {
    private readonly workOrderRepository;
    private readonly commentRepository;
    private readonly attachmentRepository;
    private readonly cacheService;
    constructor(workOrderRepository: Repository<WorkOrder>, commentRepository: Repository<WorkOrderComment>, attachmentRepository: Repository<WorkOrderAttachment>, cacheService: CacheService);
    findAll(filters?: {
        status?: WorkOrderStatus;
        assignedTo?: string;
        priority?: string;
        type?: string;
        search?: string;
        dateFrom?: string;
        dateTo?: string;
        overdueOnly?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<WorkOrder[]>;
    findById(id: string): Promise<WorkOrder | null>;
    create(workOrderData: Partial<WorkOrder>): Promise<WorkOrder>;
    update(id: string, updateData: Partial<WorkOrder>): Promise<WorkOrder>;
    updateStatus(id: string, status: WorkOrderStatus, completionNotes?: string): Promise<WorkOrder>;
    delete(id: string): Promise<void>;
    findOverdue(): Promise<WorkOrder[]>;
    getDashboardStats(): Promise<DashboardStats>;
    addComment(workOrderId: string, content: string, authorId: string, isInternal?: boolean): Promise<WorkOrderComment>;
    addAttachment(workOrderId: string, fileName: string, originalName: string, mimeType: string, fileSize: number, filePath: string, uploadedById: string, description?: string): Promise<WorkOrderAttachment>;
    seedSampleWorkOrders(): Promise<WorkOrder[]>;
    private generateWorkOrderNumber;
}
