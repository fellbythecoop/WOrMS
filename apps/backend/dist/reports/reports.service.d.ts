import { WorkOrdersService } from '../work-orders/work-orders.service';
import { AssetsService } from '../assets/assets.service';
import { UsersService } from '../users/users.service';
import { PdfReportService } from './pdf-report.service';
export declare class ReportsService {
    private readonly workOrdersService;
    private readonly assetsService;
    private readonly usersService;
    private readonly pdfReportService;
    constructor(workOrdersService: WorkOrdersService, assetsService: AssetsService, usersService: UsersService, pdfReportService: PdfReportService);
    generateWorkOrderPdf(workOrderId: string): Promise<Buffer>;
    generateCompletionReport(workOrderId: string, signature: string, completionNotes?: string): Promise<Buffer>;
    generateMaintenanceScheduleReport(): Promise<Buffer>;
    generateDashboardSummaryReport(): Promise<Buffer>;
}
