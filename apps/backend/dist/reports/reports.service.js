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
const pdf_lib_1 = require("pdf-lib");
const work_orders_service_1 = require("../work-orders/work-orders.service");
const assets_service_1 = require("../assets/assets.service");
const users_service_1 = require("../users/users.service");
let ReportsService = class ReportsService {
    constructor(workOrdersService, assetsService, usersService) {
        this.workOrdersService = workOrdersService;
        this.assetsService = assetsService;
        this.usersService = usersService;
    }
    async generateWorkOrderPdf(workOrderId) {
        const workOrder = await this.workOrdersService.findById(workOrderId);
        if (!workOrder) {
            throw new Error('Work order not found');
        }
        const pdfDoc = await pdf_lib_1.PDFDocument.create();
        const timesRomanFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.TimesRoman);
        const timesRomanBoldFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.TimesRomanBold);
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const fontSize = 12;
        const titleFontSize = 18;
        let yPosition = height - 50;
        page.drawText('Work Order Report', {
            x: 50,
            y: yPosition,
            size: titleFontSize,
            font: timesRomanBoldFont,
            color: (0, pdf_lib_1.rgb)(0, 0, 0),
        });
        yPosition -= 40;
        const details = [
            `Work Order #: ${workOrder.workOrderNumber}`,
            `Title: ${workOrder.title}`,
            `Status: ${workOrder.status}`,
            `Priority: ${workOrder.priority}`,
            `Type: ${workOrder.type}`,
            `Requested By: ${workOrder.requestedBy?.fullName || 'N/A'}`,
            `Assigned To: ${workOrder.assignedTo?.fullName || 'Unassigned'}`,
            `Asset: ${workOrder.asset?.name || 'N/A'}`,
            `Created: ${workOrder.createdAt.toLocaleDateString()}`,
            `Scheduled Start: ${workOrder.scheduledStartDate?.toLocaleDateString() || 'N/A'}`,
            `Scheduled End: ${workOrder.scheduledEndDate?.toLocaleDateString() || 'N/A'}`,
        ];
        for (const detail of details) {
            page.drawText(detail, {
                x: 50,
                y: yPosition,
                size: fontSize,
                font: timesRomanFont,
                color: (0, pdf_lib_1.rgb)(0, 0, 0),
            });
            yPosition -= 20;
        }
        yPosition -= 20;
        page.drawText('Description:', {
            x: 50,
            y: yPosition,
            size: fontSize,
            font: timesRomanBoldFont,
            color: (0, pdf_lib_1.rgb)(0, 0, 0),
        });
        yPosition -= 20;
        const descriptionLines = this.splitTextIntoLines(workOrder.description, 80);
        for (const line of descriptionLines) {
            page.drawText(line, {
                x: 50,
                y: yPosition,
                size: fontSize,
                font: timesRomanFont,
                color: (0, pdf_lib_1.rgb)(0, 0, 0),
            });
            yPosition -= 15;
        }
        if (workOrder.comments && workOrder.comments.length > 0) {
            yPosition -= 20;
            page.drawText('Comments:', {
                x: 50,
                y: yPosition,
                size: fontSize,
                font: timesRomanBoldFont,
                color: (0, pdf_lib_1.rgb)(0, 0, 0),
            });
            yPosition -= 20;
            for (const comment of workOrder.comments) {
                if (yPosition < 100) {
                    const newPage = pdfDoc.addPage();
                    yPosition = height - 50;
                }
                page.drawText(`${comment.author?.fullName || 'Unknown'} - ${comment.createdAt.toLocaleDateString()}:`, {
                    x: 50,
                    y: yPosition,
                    size: fontSize - 1,
                    font: timesRomanBoldFont,
                    color: (0, pdf_lib_1.rgb)(0, 0, 0),
                });
                yPosition -= 15;
                const commentLines = this.splitTextIntoLines(comment.content, 80);
                for (const line of commentLines) {
                    page.drawText(line, {
                        x: 70,
                        y: yPosition,
                        size: fontSize - 1,
                        font: timesRomanFont,
                        color: (0, pdf_lib_1.rgb)(0, 0, 0),
                    });
                    yPosition -= 15;
                }
                yPosition -= 10;
            }
        }
        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
    }
    async generateCompletionReport(workOrderId, signature, completionNotes) {
        const workOrder = await this.workOrdersService.findById(workOrderId);
        if (!workOrder) {
            throw new Error('Work order not found');
        }
        const pdfDoc = await pdf_lib_1.PDFDocument.create();
        const timesRomanFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.TimesRoman);
        const timesRomanBoldFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.TimesRomanBold);
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const fontSize = 12;
        const titleFontSize = 18;
        let yPosition = height - 50;
        page.drawText('Work Order Completion Report', {
            x: 50,
            y: yPosition,
            size: titleFontSize,
            font: timesRomanBoldFont,
            color: (0, pdf_lib_1.rgb)(0, 0, 0),
        });
        yPosition -= 40;
        const completionDetails = [
            `Work Order #: ${workOrder.workOrderNumber}`,
            `Title: ${workOrder.title}`,
            `Completed By: ${workOrder.assignedTo?.fullName || 'N/A'}`,
            `Completion Date: ${workOrder.actualEndDate?.toLocaleDateString() || new Date().toLocaleDateString()}`,
            `Duration: ${workOrder.duration || 'N/A'} days`,
        ];
        for (const detail of completionDetails) {
            page.drawText(detail, {
                x: 50,
                y: yPosition,
                size: fontSize,
                font: timesRomanFont,
                color: (0, pdf_lib_1.rgb)(0, 0, 0),
            });
            yPosition -= 20;
        }
        yPosition -= 20;
        if (completionNotes) {
            page.drawText('Completion Notes:', {
                x: 50,
                y: yPosition,
                size: fontSize,
                font: timesRomanBoldFont,
                color: (0, pdf_lib_1.rgb)(0, 0, 0),
            });
            yPosition -= 20;
            const notesLines = this.splitTextIntoLines(completionNotes, 80);
            for (const line of notesLines) {
                page.drawText(line, {
                    x: 50,
                    y: yPosition,
                    size: fontSize,
                    font: timesRomanFont,
                    color: (0, pdf_lib_1.rgb)(0, 0, 0),
                });
                yPosition -= 15;
            }
        }
        yPosition -= 40;
        page.drawText('Technician Signature:', {
            x: 50,
            y: yPosition,
            size: fontSize,
            font: timesRomanBoldFont,
            color: (0, pdf_lib_1.rgb)(0, 0, 0),
        });
        page.drawRectangle({
            x: 50,
            y: yPosition - 60,
            width: 200,
            height: 50,
            borderColor: (0, pdf_lib_1.rgb)(0, 0, 0),
            borderWidth: 1,
        });
        page.drawText('[Signature]', {
            x: 120,
            y: yPosition - 40,
            size: fontSize,
            font: timesRomanFont,
            color: (0, pdf_lib_1.rgb)(0.5, 0.5, 0.5),
        });
        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
    }
    async generateMaintenanceScheduleReport() {
        const assets = await this.assetsService.findMaintenanceDue();
        const pdfDoc = await pdf_lib_1.PDFDocument.create();
        const timesRomanFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.TimesRoman);
        const timesRomanBoldFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.TimesRomanBold);
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const fontSize = 12;
        const titleFontSize = 18;
        let yPosition = height - 50;
        page.drawText('Asset Maintenance Schedule', {
            x: 50,
            y: yPosition,
            size: titleFontSize,
            font: timesRomanBoldFont,
            color: (0, pdf_lib_1.rgb)(0, 0, 0),
        });
        yPosition -= 40;
        page.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
            x: 50,
            y: yPosition,
            size: fontSize,
            font: timesRomanFont,
            color: (0, pdf_lib_1.rgb)(0, 0, 0),
        });
        yPosition -= 40;
        const headers = ['Asset', 'Category', 'Location', 'Next Maintenance'];
        let xPosition = 50;
        for (const header of headers) {
            page.drawText(header, {
                x: xPosition,
                y: yPosition,
                size: fontSize,
                font: timesRomanBoldFont,
                color: (0, pdf_lib_1.rgb)(0, 0, 0),
            });
            xPosition += 120;
        }
        yPosition -= 20;
        page.drawLine({
            start: { x: 50, y: yPosition },
            end: { x: width - 50, y: yPosition },
            thickness: 1,
            color: (0, pdf_lib_1.rgb)(0, 0, 0),
        });
        yPosition -= 20;
        for (const asset of assets) {
            if (yPosition < 100) {
                const newPage = pdfDoc.addPage();
                yPosition = height - 50;
            }
            xPosition = 50;
            const rowData = [
                asset.name,
                asset.category,
                asset.location || 'N/A',
                asset.nextMaintenanceDate?.toLocaleDateString() || 'N/A',
            ];
            for (const data of rowData) {
                page.drawText(data, {
                    x: xPosition,
                    y: yPosition,
                    size: fontSize,
                    font: timesRomanFont,
                    color: (0, pdf_lib_1.rgb)(0, 0, 0),
                });
                xPosition += 120;
            }
            yPosition -= 20;
        }
        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
    }
    async generateDashboardSummaryReport() {
        const stats = await this.workOrdersService.getDashboardStats();
        const pdfDoc = await pdf_lib_1.PDFDocument.create();
        const timesRomanFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.TimesRoman);
        const timesRomanBoldFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.TimesRomanBold);
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const fontSize = 12;
        const titleFontSize = 18;
        let yPosition = height - 50;
        page.drawText('Dashboard Summary Report', {
            x: 50,
            y: yPosition,
            size: titleFontSize,
            font: timesRomanBoldFont,
            color: (0, pdf_lib_1.rgb)(0, 0, 0),
        });
        yPosition -= 40;
        page.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
            x: 50,
            y: yPosition,
            size: fontSize,
            font: timesRomanFont,
            color: (0, pdf_lib_1.rgb)(0, 0, 0),
        });
        yPosition -= 40;
        const statsData = [
            `Open Work Orders: ${stats.open}`,
            `In Progress Work Orders: ${stats.inProgress}`,
            `Completed Work Orders: ${stats.completed}`,
            `Overdue Work Orders: ${stats.overdue}`,
            `Completed Today: ${stats.completedToday}`,
        ];
        for (const stat of statsData) {
            page.drawText(stat, {
                x: 50,
                y: yPosition,
                size: fontSize,
                font: timesRomanFont,
                color: (0, pdf_lib_1.rgb)(0, 0, 0),
            });
            yPosition -= 25;
        }
        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
    }
    splitTextIntoLines(text, maxCharsPerLine) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        for (const word of words) {
            if ((currentLine + word).length <= maxCharsPerLine) {
                currentLine += (currentLine ? ' ' : '') + word;
            }
            else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
        return lines;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [work_orders_service_1.WorkOrdersService,
        assets_service_1.AssetsService,
        users_service_1.UsersService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map