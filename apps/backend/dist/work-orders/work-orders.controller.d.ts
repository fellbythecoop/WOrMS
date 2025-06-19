import { Response } from 'express';
import { WorkOrdersService } from './work-orders.service';
import { TimeEntryService, CreateTimeEntryDto, UpdateTimeEntryDto } from './time-entry.service';
import { WorkOrder, WorkOrderStatus } from './entities/work-order.entity';
import { WorkOrderAttachment } from './entities/work-order-attachment.entity';
export declare class WorkOrdersController {
    private readonly workOrdersService;
    private readonly timeEntryService;
    constructor(workOrdersService: WorkOrdersService, timeEntryService: TimeEntryService);
    findAll(req: any, status?: WorkOrderStatus, assignedTo?: string, priority?: string, type?: string, search?: string, dateFrom?: string, dateTo?: string, overdueOnly?: boolean, limit?: number, offset?: number): Promise<WorkOrder[]>;
    getTimeEntries(workOrderId: string, req: any): Promise<import("./entities/work-order-time-entry.entity").WorkOrderTimeEntry[]>;
    addTimeEntry(workOrderId: string, timeEntryData: Omit<CreateTimeEntryDto, 'workOrderId'>, req: any): Promise<import("./entities/work-order-time-entry.entity").WorkOrderTimeEntry>;
    findOne(id: string, req: any): Promise<WorkOrder>;
    create(createWorkOrderData: Partial<WorkOrder>, req: any): Promise<WorkOrder>;
    update(id: string, updateData: Partial<WorkOrder>, req: any): Promise<WorkOrder>;
    updateStatus(id: string, statusData: {
        status: WorkOrderStatus;
        completionNotes?: string;
    }, req: any): Promise<WorkOrder>;
    remove(id: string): Promise<void>;
    updateTimeEntry(timeEntryId: string, updateData: UpdateTimeEntryDto, req: any): Promise<import("./entities/work-order-time-entry.entity").WorkOrderTimeEntry>;
    deleteTimeEntry(timeEntryId: string, req: any): Promise<void>;
    getDashboardStats(req: any): Promise<import("./work-orders.service").DashboardStats>;
    getOverdueWorkOrders(req: any): Promise<WorkOrder[]>;
    addComment(id: string, commentData: {
        content: string;
        isInternal?: boolean;
    }, req: any): Promise<import("./entities/work-order-comment.entity").WorkOrderComment>;
    uploadAttachment(workOrderId: string, file: Express.Multer.File, body: {
        description?: string;
    }, req: any): Promise<WorkOrderAttachment>;
    downloadAttachment(attachmentId: string, res: Response, req: any): Promise<void>;
    deleteAttachment(attachmentId: string, req: any): Promise<void>;
    seedSampleWorkOrders(): Promise<WorkOrder[]>;
}
