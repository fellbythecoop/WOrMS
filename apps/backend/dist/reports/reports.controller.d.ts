import { Response } from 'express';
import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    generateWorkOrderPdf(workOrderId: string, res: Response): Promise<void>;
    generateCompletionReport(workOrderId: string, data: {
        signature: string;
        completionNotes?: string;
    }, res: Response): Promise<void>;
    generateMaintenanceScheduleReport(res: Response): Promise<void>;
    generateDashboardSummaryReport(res: Response): Promise<void>;
}
