import { Repository } from 'typeorm';
import { WorkOrder, WorkOrderStatus } from './entities/work-order.entity';
import { WorkOrderComment } from './entities/work-order-comment.entity';
import { WorkOrderAttachment } from './entities/work-order-attachment.entity';
import { User } from '../users/entities/user.entity';
import { CacheService } from '../cache/cache.service';
import { SchedulingService } from '../scheduling/scheduling.service';
import { WorkOrdersGateway } from '../websocket/work-orders.gateway';
export interface DashboardStats {
    open: number;
    inProgress: number;
    completed: number;
    overdue: number;
    completedToday: number;
}
export interface ScheduleConflictWarning {
    message: string;
    severity: 'warning' | 'error';
    technicianName: string;
    date: string;
    currentUtilization: number;
    newUtilization: number;
    scheduledHours: number;
    availableHours: number;
}
export declare class WorkOrdersService {
    private readonly workOrderRepository;
    private readonly commentRepository;
    private readonly attachmentRepository;
    private readonly userRepository;
    private readonly cacheService;
    private readonly schedulingService;
    private readonly workOrdersGateway;
    private readonly logger;
    private readonly recalculationLocks;
    constructor(workOrderRepository: Repository<WorkOrder>, commentRepository: Repository<WorkOrderComment>, attachmentRepository: Repository<WorkOrderAttachment>, userRepository: Repository<User>, cacheService: CacheService, schedulingService: SchedulingService, workOrdersGateway: WorkOrdersGateway);
    findAll(filters?: {
        status?: WorkOrderStatus;
        assignedTo?: string;
        priority?: string;
        type?: string;
        search?: string;
        tags?: string[];
        dateFrom?: string;
        dateTo?: string;
        overdueOnly?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<WorkOrder[]>;
    findById(id: string): Promise<WorkOrder | null>;
    create(workOrderData: Partial<WorkOrder>): Promise<WorkOrder>;
    update(id: string, updateData: Partial<WorkOrder>): Promise<WorkOrder>;
    updateStatus(id: string, status: WorkOrderStatus, completionNotes?: string, billingStatus?: 'not_ready' | 'in_progress' | 'ready' | 'completed'): Promise<WorkOrder>;
    delete(id: string): Promise<void>;
    findOverdue(): Promise<WorkOrder[]>;
    getDashboardStats(): Promise<DashboardStats>;
    getDashboardStatsForUser(userId: string): Promise<DashboardStats>;
    findOverdueByUser(userId: string): Promise<WorkOrder[]>;
    findScheduledWorkOrders(filters: {
        startDate: string;
        endDate: string;
        technicianId?: string;
        status?: WorkOrderStatus;
    }): Promise<WorkOrder[]>;
    findActiveWorkOrders(filters?: {
        search?: string;
        status?: WorkOrderStatus;
        priority?: string;
        type?: string;
    }): Promise<WorkOrder[]>;
    addComment(workOrderId: string, content: string, authorId: string, isInternal?: boolean): Promise<WorkOrderComment>;
    addAttachment(workOrderId: string, fileName: string, originalName: string, mimeType: string, fileSize: number, filePath: string, uploadedById: string, description?: string): Promise<WorkOrderAttachment>;
    getAttachmentById(attachmentId: string): Promise<WorkOrderAttachment | null>;
    deleteAttachment(attachmentId: string): Promise<void>;
    getAllTags(): Promise<string[]>;
    seedSampleWorkOrders(): Promise<WorkOrder[]>;
    private generateWorkOrderNumber;
    checkScheduleConflicts(workOrder: Partial<WorkOrder> & {
        assignedToId?: string;
        scheduledStartDate?: Date;
        estimatedHours?: number;
    }): Promise<ScheduleConflictWarning[]>;
    assignWorkOrder(workOrderId: string, assignedToId: string, scheduledStartDate?: Date, estimatedHours?: number): Promise<{
        workOrder: WorkOrder;
        warnings: ScheduleConflictWarning[];
    }>;
    private updateScheduleForWorkOrder;
    private recalculateScheduleHours;
    private performRecalculation;
    private removeScheduleForWorkOrder;
    private findTechnicianById;
}
