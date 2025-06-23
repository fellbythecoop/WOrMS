import { WorkOrder } from '../work-orders/entities/work-order.entity';
import { User } from '../users/entities/user.entity';
import { Asset } from '../assets/entities/asset.entity';
import { WorkOrderComment } from '../work-orders/entities/work-order-comment.entity';
import { WorkOrderAttachment } from '../work-orders/entities/work-order-attachment.entity';
export declare class PdfReportService {
    private readonly logger;
    private readonly colors;
    private readonly spacing;
    private readonly fonts;
    generateWorkOrderCompletionReport(workOrder: WorkOrder, assignedTechnician: User | null, requester: User | null, asset?: Asset, comments?: WorkOrderComment[], attachments?: WorkOrderAttachment[], additionalAssignees?: User[]): Promise<Buffer>;
    private drawHeader;
    private drawWorkOrderInfo;
    private drawPersonnelInfo;
    private drawWorkDescription;
    private drawTimeTracking;
    private drawWorkPerformed;
    private drawPartsSection;
    private drawComments;
    private drawSignatureSection;
    private drawFooter;
    private getStatusColor;
    private formatTimeEntryType;
    private wrapText;
    private formatFileSize;
    private estimateWorkPerformedHeight;
    private drawPageContinuationHeader;
}
