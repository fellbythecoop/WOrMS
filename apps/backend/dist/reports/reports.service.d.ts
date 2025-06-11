import { WorkOrdersService } from '../work-orders/work-orders.service';
import { AssetsService } from '../assets/assets.service';
import { UsersService } from '../users/users.service';
export declare class ReportsService {
    private readonly workOrdersService;
    private readonly assetsService;
    private readonly usersService;
    constructor(workOrdersService: WorkOrdersService, assetsService: AssetsService, usersService: UsersService);
    generateWorkOrderPdf(workOrderId: string): Promise<Buffer>;
    generateCompletionReport(workOrderId: string, signature: string, completionNotes?: string): Promise<Buffer>;
    generateMaintenanceScheduleReport(): Promise<Buffer>;
    generateDashboardSummaryReport(): Promise<Buffer>;
    private splitTextIntoLines;
}
