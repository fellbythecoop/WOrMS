"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const work_orders_service_1 = require("../work-orders/work-orders.service");
const assets_service_1 = require("../assets/assets.service");
const users_service_1 = require("../users/users.service");
const pdf_report_service_1 = require("./pdf-report.service");
let ReportsService = class ReportsService {
    constructor(workOrdersService, assetsService, usersService, pdfReportService) {
        this.workOrdersService = workOrdersService;
        this.assetsService = assetsService;
        this.usersService = usersService;
        this.pdfReportService = pdfReportService;
    }
    async generateWorkOrderPdf(workOrderId) {
        const workOrder = await this.workOrdersService.findById(workOrderId);
        if (!workOrder) {
            throw new Error('Work order not found');
        }
        const assignedTechnician = workOrder.assignedTo ? await this.usersService.findById(workOrder.assignedTo.id) : null;
        const asset = workOrder.asset ? await this.assetsService.findById(workOrder.asset.id) : null;
        return this.pdfReportService.generateWorkOrderCompletionReport(workOrder, assignedTechnician, null, asset, workOrder.comments, workOrder.attachments);
    }
    async generateCompletionReport(workOrderId, signature, completionNotes) {
        const workOrder = await this.workOrdersService.findById(workOrderId);
        if (!workOrder) {
            throw new Error('Work order not found');
        }
        const assignedTechnician = workOrder.assignedTo ? await this.usersService.findById(workOrder.assignedTo.id) : null;
        const asset = workOrder.asset ? await this.assetsService.findById(workOrder.asset.id) : null;
        let comments = workOrder.comments || [];
        if (completionNotes) {
            comments = [
                ...comments,
                {
                    id: 'completion-note',
                    content: `COMPLETION NOTES: ${completionNotes}`,
                    author: assignedTechnician,
                    createdAt: new Date(),
                    isInternal: false,
                },
            ];
        }
        return this.pdfReportService.generateWorkOrderCompletionReport(workOrder, assignedTechnician, null, asset, comments, workOrder.attachments);
    }
    async generateMaintenanceScheduleReport() {
        const assets = await this.assetsService.findMaintenanceDue();
        const pdfDoc = await Promise.resolve().then(() => require('pdf-lib')).then(lib => lib.PDFDocument.create());
        const page = pdfDoc.addPage([595.28, 841.89]);
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(await Promise.resolve().then(() => require('pdf-lib')).then(lib => lib.StandardFonts.Helvetica));
        const boldFont = await pdfDoc.embedFont(await Promise.resolve().then(() => require('pdf-lib')).then(lib => lib.StandardFonts.HelveticaBold));
        let yPosition = height - 50;
        page.drawText('Asset Maintenance Schedule Report', {
            x: 50,
            y: yPosition,
            size: 20,
            font: boldFont,
        });
        yPosition -= 40;
        page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
            x: 50,
            y: yPosition,
            size: 12,
            font: font,
        });
        yPosition -= 30;
        page.drawText('Asset', {
            x: 50,
            y: yPosition,
            size: 12,
            font: boldFont,
        });
        page.drawText('Category', {
            x: 200,
            y: yPosition,
            size: 12,
            font: boldFont,
        });
        page.drawText('Location', {
            x: 300,
            y: yPosition,
            size: 12,
            font: boldFont,
        });
        page.drawText('Next Maintenance', {
            x: 400,
            y: yPosition,
            size: 12,
            font: boldFont,
        });
        yPosition -= 20;
        for (const asset of assets) {
            if (yPosition < 100) {
                const newPage = pdfDoc.addPage([595.28, 841.89]);
                yPosition = height - 50;
            }
            page.drawText(asset.name, {
                x: 50,
                y: yPosition,
                size: 10,
                font: font,
            });
            page.drawText(asset.category || 'N/A', {
                x: 200,
                y: yPosition,
                size: 10,
                font: font,
            });
            page.drawText(asset.location || 'N/A', {
                x: 300,
                y: yPosition,
                size: 10,
                font: font,
            });
            page.drawText(asset.nextMaintenanceDate ? new Date(asset.nextMaintenanceDate).toLocaleDateString() : 'N/A', {
                x: 400,
                y: yPosition,
                size: 10,
                font: font,
            });
            yPosition -= 15;
        }
        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
    }
    async generateDashboardSummaryReport() {
        const dashboardStats = await this.workOrdersService.getDashboardStats();
        const assets = await this.assetsService.findAll();
        const users = await this.usersService.findAll();
        const pdfDoc = await Promise.resolve().then(() => require('pdf-lib')).then(lib => lib.PDFDocument.create());
        const page = pdfDoc.addPage([595.28, 841.89]);
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(await Promise.resolve().then(() => require('pdf-lib')).then(lib => lib.StandardFonts.Helvetica));
        const boldFont = await pdfDoc.embedFont(await Promise.resolve().then(() => require('pdf-lib')).then(lib => lib.StandardFonts.HelveticaBold));
        let yPosition = height - 50;
        page.drawText('Dashboard Summary Report', {
            x: 50,
            y: yPosition,
            size: 20,
            font: boldFont,
        });
        yPosition -= 40;
        page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
            x: 50,
            y: yPosition,
            size: 12,
            font: font,
        });
        yPosition -= 30;
        page.drawText('Work Order Statistics:', {
            x: 50,
            y: yPosition,
            size: 14,
            font: boldFont,
        });
        yPosition -= 20;
        const stats = [
            `Open Work Orders: ${dashboardStats.open}`,
            `In Progress: ${dashboardStats.inProgress}`,
            `Completed Today: ${dashboardStats.completedToday}`,
            `Overdue: ${dashboardStats.overdue}`,
        ];
        for (const stat of stats) {
            page.drawText(stat, {
                x: 50,
                y: yPosition,
                size: 12,
                font: font,
            });
            yPosition -= 18;
        }
        yPosition -= 20;
        page.drawText('Asset Statistics:', {
            x: 50,
            y: yPosition,
            size: 14,
            font: boldFont,
        });
        yPosition -= 20;
        const assetStats = [
            `Total Assets: ${assets.length}`,
            `Active Assets: ${assets.filter(a => a.status === 'active').length}`,
            `In Maintenance: ${assets.filter(a => a.status === 'maintenance').length}`,
            `Retired Assets: ${assets.filter(a => a.status === 'retired').length}`,
        ];
        for (const stat of assetStats) {
            page.drawText(stat, {
                x: 50,
                y: yPosition,
                size: 12,
                font: font,
            });
            yPosition -= 18;
        }
        yPosition -= 20;
        page.drawText('User Statistics:', {
            x: 50,
            y: yPosition,
            size: 14,
            font: boldFont,
        });
        yPosition -= 20;
        const userStats = [
            `Total Users: ${users.length}`,
            `Active Users: ${users.filter(u => u.status === 'active').length}`,
            `Technicians: ${users.filter(u => u.role === 'technician').length}`,
            `Administrators: ${users.filter(u => u.role === 'administrator').length}`,
        ];
        for (const stat of userStats) {
            page.drawText(stat, {
                x: 50,
                y: yPosition,
                size: 12,
                font: font,
            });
            yPosition -= 18;
        }
        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [work_orders_service_1.WorkOrdersService,
        assets_service_1.AssetsService,
        users_service_1.UsersService,
        pdf_report_service_1.PdfReportService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map