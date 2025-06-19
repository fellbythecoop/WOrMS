import { WorkOrder } from '../work-orders/entities/work-order.entity';
import { User } from '../users/entities/user.entity';
import { Asset } from '../assets/entities/asset.entity';
import { WorkOrderComment } from '../work-orders/entities/work-order-comment.entity';
import { WorkOrderAttachment } from '../work-orders/entities/work-order-attachment.entity';
export declare class PdfReportService {
    private readonly logger;
    generateWorkOrderCompletionReport(workOrder: WorkOrder, assignedTechnician: User | null, requester: User | null, asset?: Asset, comments?: WorkOrderComment[], attachments?: WorkOrderAttachment[]): Promise<Buffer>;
    private wrapText;
    private formatFileSize;
}
