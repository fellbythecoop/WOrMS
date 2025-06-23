"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PdfReportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfReportService = void 0;
const common_1 = require("@nestjs/common");
const pdf_lib_1 = require("pdf-lib");
let PdfReportService = PdfReportService_1 = class PdfReportService {
    constructor() {
        this.logger = new common_1.Logger(PdfReportService_1.name);
        this.colors = {
            primary: (0, pdf_lib_1.rgb)(0.06, 0.25, 0.49),
            secondary: (0, pdf_lib_1.rgb)(0.97, 0.97, 0.97),
            accent: (0, pdf_lib_1.rgb)(0.8, 0.33, 0.0),
            success: (0, pdf_lib_1.rgb)(0.13, 0.59, 0.33),
            warning: (0, pdf_lib_1.rgb)(0.85, 0.65, 0.13),
            error: (0, pdf_lib_1.rgb)(0.8, 0.24, 0.24),
            text: (0, pdf_lib_1.rgb)(0.2, 0.2, 0.2),
            lightGray: (0, pdf_lib_1.rgb)(0.95, 0.95, 0.95),
            darkGray: (0, pdf_lib_1.rgb)(0.5, 0.5, 0.5),
            white: (0, pdf_lib_1.rgb)(1, 1, 1),
            border: (0, pdf_lib_1.rgb)(0.8, 0.8, 0.8),
            tableHeader: (0, pdf_lib_1.rgb)(0.92, 0.92, 0.92),
            tableRowAlt: (0, pdf_lib_1.rgb)(0.98, 0.98, 0.98),
        };
        this.spacing = {
            pageMargin: 50,
            sectionSpacing: 25,
            lineHeight: 16,
            headerHeight: 80,
            sectionHeaderHeight: 24,
        };
        this.fonts = {
            title: 18,
            sectionHeader: 11,
            fieldLabel: 9,
            fieldValue: 9,
            tableHeader: 8,
            tableData: 8,
            footer: 7,
        };
    }
    async generateWorkOrderCompletionReport(workOrder, assignedTechnician, requester, asset, comments, attachments, additionalAssignees) {
        try {
            const pdfDoc = await pdf_lib_1.PDFDocument.create();
            let currentPage = pdfDoc.addPage([612, 792]);
            const { width, height } = currentPage.getSize();
            const regularFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
            const italicFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaOblique);
            let yPosition = height - this.spacing.pageMargin;
            yPosition = this.drawHeader(currentPage, boldFont, regularFont, workOrder, yPosition, width);
            yPosition = this.drawWorkOrderInfo(currentPage, boldFont, regularFont, workOrder, asset, yPosition, width);
            yPosition = this.drawPersonnelInfo(currentPage, boldFont, regularFont, workOrder, assignedTechnician, yPosition, width, additionalAssignees);
            yPosition = this.drawWorkDescription(currentPage, boldFont, regularFont, workOrder, yPosition, width);
            if (workOrder.timeEntries && workOrder.timeEntries.length > 0) {
                yPosition = this.drawTimeTracking(currentPage, boldFont, regularFont, workOrder.timeEntries, yPosition, width);
            }
            const estimatedWorkPerformedHeight = this.estimateWorkPerformedHeight(workOrder.timeEntries || []);
            if (yPosition - estimatedWorkPerformedHeight < 200) {
                currentPage = pdfDoc.addPage([612, 792]);
                yPosition = height - this.spacing.pageMargin;
                this.drawPageContinuationHeader(currentPage, boldFont, regularFont, workOrder, yPosition, width);
                yPosition -= this.spacing.headerHeight;
            }
            yPosition = this.drawWorkPerformed(currentPage, boldFont, regularFont, workOrder.timeEntries || [], yPosition, width);
            yPosition = this.drawPartsSection(currentPage, boldFont, regularFont, attachments || [], yPosition, width);
            if (comments && comments.length > 0) {
                yPosition = this.drawComments(currentPage, boldFont, regularFont, comments, yPosition, width);
            }
            if (yPosition < 250) {
                currentPage = pdfDoc.addPage([612, 792]);
                yPosition = height - this.spacing.pageMargin;
                this.drawPageContinuationHeader(currentPage, boldFont, regularFont, workOrder, yPosition, width);
                yPosition -= this.spacing.headerHeight;
            }
            yPosition = this.drawSignatureSection(currentPage, boldFont, regularFont, workOrder, yPosition, width);
            const pages = pdfDoc.getPages();
            pages.forEach((page, index) => {
                this.drawFooter(page, regularFont, width, this.spacing.pageMargin, index + 1, pages.length);
            });
            const pdfBytes = await pdfDoc.save();
            return Buffer.from(pdfBytes);
        }
        catch (error) {
            this.logger.error('Error generating PDF report:', error);
            throw new Error('Failed to generate PDF report');
        }
    }
    drawHeader(page, boldFont, regularFont, workOrder, yPosition, width) {
        page.drawRectangle({
            x: this.spacing.pageMargin + 2,
            y: yPosition - this.spacing.headerHeight + 2,
            width: width - (2 * this.spacing.pageMargin),
            height: this.spacing.headerHeight,
            color: (0, pdf_lib_1.rgb)(0.9, 0.9, 0.9),
        });
        page.drawRectangle({
            x: this.spacing.pageMargin,
            y: yPosition - this.spacing.headerHeight,
            width: width - (2 * this.spacing.pageMargin),
            height: this.spacing.headerHeight,
            color: this.colors.primary,
        });
        page.drawText('WORK ORDER MANAGEMENT SYSTEM', {
            x: this.spacing.pageMargin + 20,
            y: yPosition - 35,
            size: this.fonts.title,
            font: boldFont,
            color: this.colors.white,
        });
        page.drawText('Professional Service Report', {
            x: this.spacing.pageMargin + 20,
            y: yPosition - 55,
            size: 12,
            font: regularFont,
            color: (0, pdf_lib_1.rgb)(0.9, 0.9, 0.9),
        });
        const woTitle = 'WORK ORDER';
        page.drawText(woTitle, {
            x: width - 200,
            y: yPosition - 40,
            size: 22,
            font: boldFont,
            color: this.colors.accent,
        });
        const statusColor = this.getStatusColor(workOrder.status);
        const statusText = workOrder.status.toUpperCase().replace('_', ' ');
        page.drawRectangle({
            x: width - 180,
            y: yPosition - 65,
            width: 120,
            height: 18,
            color: statusColor,
        });
        page.drawText(statusText, {
            x: width - 175,
            y: yPosition - 60,
            size: 9,
            font: boldFont,
            color: this.colors.white,
        });
        page.drawLine({
            start: { x: this.spacing.pageMargin, y: yPosition - this.spacing.headerHeight - 5 },
            end: { x: width - this.spacing.pageMargin, y: yPosition - this.spacing.headerHeight - 5 },
            thickness: 2,
            color: this.colors.accent,
        });
        return yPosition - this.spacing.headerHeight - 15;
    }
    drawWorkOrderInfo(page, boldFont, regularFont, workOrder, asset, yPosition, width) {
        page.drawRectangle({
            x: this.spacing.pageMargin,
            y: yPosition - this.spacing.sectionHeaderHeight,
            width: width - (2 * this.spacing.pageMargin),
            height: this.spacing.sectionHeaderHeight,
            color: this.colors.tableHeader,
            borderColor: this.colors.border,
            borderWidth: 1,
        });
        page.drawText('WORK ORDER INFORMATION', {
            x: this.spacing.pageMargin + 15,
            y: yPosition - 16,
            size: this.fonts.sectionHeader,
            font: boldFont,
            color: this.colors.primary,
        });
        yPosition -= this.spacing.sectionHeaderHeight + 10;
        const cardHeight = 60;
        page.drawRectangle({
            x: this.spacing.pageMargin,
            y: yPosition - cardHeight,
            width: width - (2 * this.spacing.pageMargin),
            height: cardHeight,
            color: this.colors.white,
            borderColor: this.colors.border,
            borderWidth: 1,
        });
        const leftColumn = this.spacing.pageMargin + 20;
        const rightColumn = width / 2 + 20;
        page.drawText('Job Number', {
            x: leftColumn,
            y: yPosition - 20,
            size: this.fonts.fieldLabel,
            font: boldFont,
            color: this.colors.darkGray,
        });
        page.drawText(workOrder.workOrderNumber, {
            x: leftColumn,
            y: yPosition - 35,
            size: this.fonts.fieldValue + 2,
            font: boldFont,
            color: this.colors.text,
        });
        page.drawText('Equipment ID', {
            x: rightColumn,
            y: yPosition - 20,
            size: this.fonts.fieldLabel,
            font: boldFont,
            color: this.colors.darkGray,
        });
        page.drawText(asset?.assetNumber || asset?.name || 'N/A', {
            x: rightColumn,
            y: yPosition - 35,
            size: this.fonts.fieldValue + 2,
            font: boldFont,
            color: this.colors.text,
        });
        return yPosition - cardHeight - this.spacing.sectionSpacing;
    }
    drawPersonnelInfo(page, boldFont, regularFont, workOrder, assignedTechnician, yPosition, width, additionalAssignees = []) {
        page.drawRectangle({
            x: this.spacing.pageMargin,
            y: yPosition - this.spacing.sectionHeaderHeight,
            width: width - (2 * this.spacing.pageMargin),
            height: this.spacing.sectionHeaderHeight,
            color: this.colors.tableHeader,
            borderColor: this.colors.border,
            borderWidth: 1,
        });
        page.drawText('PERSONNEL & CUSTOMER INFORMATION', {
            x: this.spacing.pageMargin + 15,
            y: yPosition - 16,
            size: this.fonts.sectionHeader,
            font: boldFont,
            color: this.colors.primary,
        });
        yPosition -= this.spacing.sectionHeaderHeight + 10;
        let personnelInfo = [];
        if (assignedTechnician) {
            personnelInfo.push(`${assignedTechnician.firstName} ${assignedTechnician.lastName}`);
        }
        if (additionalAssignees && additionalAssignees.length > 0) {
            additionalAssignees.forEach(user => {
                if (user) {
                    personnelInfo.push(`${user.firstName} ${user.lastName}`);
                }
            });
        }
        const customerInfo = [];
        if (workOrder.customer?.name) {
            customerInfo.push(workOrder.customer.name);
        }
        if (workOrder.customer?.address) {
            customerInfo.push(workOrder.customer.address);
        }
        const maxLines = Math.max(personnelInfo.length || 1, customerInfo.length || 1);
        const cardHeight = Math.max(80, 40 + maxLines * this.spacing.lineHeight);
        const cardWidth = (width - 3 * this.spacing.pageMargin) / 2;
        page.drawRectangle({
            x: this.spacing.pageMargin,
            y: yPosition - cardHeight,
            width: cardWidth,
            height: cardHeight,
            color: this.colors.white,
            borderColor: this.colors.border,
            borderWidth: 1,
        });
        page.drawRectangle({
            x: this.spacing.pageMargin,
            y: yPosition - 25,
            width: cardWidth,
            height: 20,
            color: (0, pdf_lib_1.rgb)(0.94, 0.97, 1),
        });
        page.drawText('Team Members', {
            x: this.spacing.pageMargin + 10,
            y: yPosition - 18,
            size: this.fonts.fieldLabel + 1,
            font: boldFont,
            color: this.colors.primary,
        });
        if (personnelInfo.length === 0) {
            page.drawText('No personnel assigned', {
                x: this.spacing.pageMargin + 10,
                y: yPosition - 45,
                size: this.fonts.fieldValue,
                font: regularFont,
                color: this.colors.darkGray,
            });
        }
        else {
            personnelInfo.forEach((person, index) => {
                const isFirst = index === 0;
                page.drawText(isFirst ? '• Primary:' : '• Additional:', {
                    x: this.spacing.pageMargin + 10,
                    y: yPosition - 40 - (index * this.spacing.lineHeight),
                    size: this.fonts.fieldLabel,
                    font: boldFont,
                    color: this.colors.darkGray,
                });
                page.drawText(person, {
                    x: this.spacing.pageMargin + 70,
                    y: yPosition - 40 - (index * this.spacing.lineHeight),
                    size: this.fonts.fieldValue,
                    font: regularFont,
                    color: this.colors.text,
                });
            });
        }
        const customerCardX = this.spacing.pageMargin + cardWidth + 10;
        page.drawRectangle({
            x: customerCardX,
            y: yPosition - cardHeight,
            width: cardWidth,
            height: cardHeight,
            color: this.colors.white,
            borderColor: this.colors.border,
            borderWidth: 1,
        });
        page.drawRectangle({
            x: customerCardX,
            y: yPosition - 25,
            width: cardWidth,
            height: 20,
            color: (0, pdf_lib_1.rgb)(0.94, 1, 0.94),
        });
        page.drawText('Customer Information', {
            x: customerCardX + 10,
            y: yPosition - 18,
            size: this.fonts.fieldLabel + 1,
            font: boldFont,
            color: this.colors.primary,
        });
        if (customerInfo.length === 0) {
            page.drawText('No customer information', {
                x: customerCardX + 10,
                y: yPosition - 45,
                size: this.fonts.fieldValue,
                font: regularFont,
                color: this.colors.darkGray,
            });
        }
        else {
            page.drawText('• Client:', {
                x: customerCardX + 10,
                y: yPosition - 40,
                size: this.fonts.fieldLabel,
                font: boldFont,
                color: this.colors.darkGray,
            });
            page.drawText(customerInfo[0], {
                x: customerCardX + 50,
                y: yPosition - 40,
                size: this.fonts.fieldValue,
                font: regularFont,
                color: this.colors.text,
            });
            if (customerInfo.length > 1) {
                page.drawText('• Address:', {
                    x: customerCardX + 10,
                    y: yPosition - 40 - this.spacing.lineHeight,
                    size: this.fonts.fieldLabel,
                    font: boldFont,
                    color: this.colors.darkGray,
                });
                const addressLines = this.wrapText(customerInfo[1], 25);
                addressLines.forEach((line, index) => {
                    page.drawText(line, {
                        x: customerCardX + 60,
                        y: yPosition - 40 - this.spacing.lineHeight - (index * 12),
                        size: this.fonts.fieldValue,
                        font: regularFont,
                        color: this.colors.text,
                    });
                });
            }
        }
        return yPosition - cardHeight - this.spacing.sectionSpacing;
    }
    drawWorkDescription(page, boldFont, regularFont, workOrder, yPosition, width) {
        page.drawRectangle({
            x: 30,
            y: yPosition - 25,
            width: width - 60,
            height: 20,
            color: this.colors.lightGray,
        });
        page.drawText('WORK REQUESTED', {
            x: 40,
            y: yPosition - 18,
            size: 12,
            font: boldFont,
            color: this.colors.primary,
        });
        yPosition -= 40;
        page.drawText('Title:', {
            x: 40,
            y: yPosition,
            size: 10,
            font: boldFont,
            color: this.colors.text,
        });
        page.drawText(workOrder.title, {
            x: 80,
            y: yPosition,
            size: 10,
            font: regularFont,
            color: this.colors.text,
        });
        yPosition -= 20;
        page.drawText('Description:', {
            x: 40,
            y: yPosition,
            size: 10,
            font: boldFont,
            color: this.colors.text,
        });
        yPosition -= 15;
        const descriptionLines = this.wrapText(workOrder.description, 90);
        const boxHeight = Math.max(descriptionLines.length * 12 + 10, 40);
        page.drawRectangle({
            x: 40,
            y: yPosition - boxHeight,
            width: width - 80,
            height: boxHeight,
            borderColor: this.colors.darkGray,
            borderWidth: 1,
        });
        descriptionLines.forEach((line, index) => {
            page.drawText(line, {
                x: 50,
                y: yPosition - 15 - (index * 12),
                size: 10,
                font: regularFont,
                color: this.colors.text,
            });
        });
        return yPosition - boxHeight - 20;
    }
    drawTimeTracking(page, boldFont, regularFont, timeEntries, yPosition, width) {
        page.drawRectangle({
            x: this.spacing.pageMargin,
            y: yPosition - this.spacing.sectionHeaderHeight,
            width: width - (2 * this.spacing.pageMargin),
            height: this.spacing.sectionHeaderHeight,
            color: this.colors.tableHeader,
            borderColor: this.colors.border,
            borderWidth: 1,
        });
        page.drawText('TIME TRACKING', {
            x: this.spacing.pageMargin + 15,
            y: yPosition - 16,
            size: this.fonts.sectionHeader,
            font: boldFont,
            color: this.colors.primary,
        });
        yPosition -= this.spacing.sectionHeaderHeight + 10;
        const tableStartY = yPosition;
        const rowHeight = 22;
        const headerHeight = 26;
        const tableWidth = width - (2 * this.spacing.pageMargin);
        const columns = [
            { label: 'Technician', width: tableWidth * 0.25, x: this.spacing.pageMargin },
            { label: 'Date', width: tableWidth * 0.15, x: 0 },
            { label: 'Type', width: tableWidth * 0.2, x: 0 },
            { label: 'Hours', width: tableWidth * 0.12, x: 0 },
            { label: 'Rate', width: tableWidth * 0.13, x: 0 },
            { label: 'Total', width: tableWidth * 0.15, x: 0 },
        ];
        for (let i = 1; i < columns.length; i++) {
            columns[i].x = columns[i - 1].x + columns[i - 1].width;
        }
        page.drawRectangle({
            x: this.spacing.pageMargin,
            y: tableStartY - headerHeight,
            width: tableWidth,
            height: headerHeight,
            color: this.colors.primary,
            borderColor: this.colors.border,
            borderWidth: 1,
        });
        columns.forEach((col) => {
            if (col.x > this.spacing.pageMargin) {
                page.drawLine({
                    start: { x: col.x, y: tableStartY },
                    end: { x: col.x, y: tableStartY - headerHeight },
                    thickness: 1,
                    color: this.colors.white,
                });
            }
            page.drawText(col.label, {
                x: col.x + 8,
                y: tableStartY - 18,
                size: this.fonts.tableHeader + 1,
                font: boldFont,
                color: this.colors.white,
            });
        });
        let currentRowY = tableStartY - headerHeight;
        timeEntries.forEach((entry, index) => {
            const rowY = currentRowY - (index * rowHeight);
            const rowColor = index % 2 === 0 ? this.colors.white : this.colors.tableRowAlt;
            page.drawRectangle({
                x: this.spacing.pageMargin,
                y: rowY - rowHeight,
                width: tableWidth,
                height: rowHeight,
                color: rowColor,
                borderColor: this.colors.border,
                borderWidth: 0.5,
            });
            const rowData = [
                entry.technician ? `${entry.technician.firstName} ${entry.technician.lastName}` : 'N/A',
                new Date(entry.date).toLocaleDateString(),
                this.formatTimeEntryType(entry.timeEntryType),
                entry.hours.toString(),
                entry.rate ? `$${entry.rate.toFixed(2)}` : 'N/A',
                entry.totalAmount ? `$${entry.totalAmount.toFixed(2)}` : 'N/A',
            ];
            columns.forEach((col, colIndex) => {
                if (col.x > this.spacing.pageMargin) {
                    page.drawLine({
                        start: { x: col.x, y: rowY },
                        end: { x: col.x, y: rowY - rowHeight },
                        thickness: 0.5,
                        color: this.colors.border,
                    });
                }
                const isNumeric = colIndex >= 3;
                const textX = isNumeric ? col.x + col.width - 40 : col.x + 8;
                page.drawText(rowData[colIndex], {
                    x: textX,
                    y: rowY - 15,
                    size: this.fonts.tableData,
                    font: regularFont,
                    color: this.colors.text,
                });
            });
        });
        const totalRowY = currentRowY - (timeEntries.length * rowHeight);
        page.drawRectangle({
            x: this.spacing.pageMargin,
            y: totalRowY - rowHeight - 2,
            width: tableWidth,
            height: rowHeight + 2,
            color: this.colors.tableHeader,
            borderColor: this.colors.border,
            borderWidth: 1,
        });
        const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
        const totalCost = timeEntries.reduce((sum, entry) => sum + (entry.totalAmount || 0), 0);
        page.drawText('TOTALS:', {
            x: columns[2].x + 8,
            y: totalRowY - 15,
            size: this.fonts.tableHeader + 1,
            font: boldFont,
            color: this.colors.primary,
        });
        page.drawText(totalHours.toFixed(1), {
            x: columns[3].x + columns[3].width - 40,
            y: totalRowY - 15,
            size: this.fonts.tableHeader + 1,
            font: boldFont,
            color: this.colors.primary,
        });
        page.drawText(`$${totalCost.toFixed(2)}`, {
            x: columns[5].x + columns[5].width - 50,
            y: totalRowY - 15,
            size: this.fonts.tableHeader + 1,
            font: boldFont,
            color: this.colors.primary,
        });
        columns.forEach((col) => {
            if (col.x > this.spacing.pageMargin) {
                page.drawLine({
                    start: { x: col.x, y: totalRowY },
                    end: { x: col.x, y: totalRowY - rowHeight - 2 },
                    thickness: 1,
                    color: this.colors.border,
                });
            }
        });
        return totalRowY - rowHeight - this.spacing.sectionSpacing;
    }
    drawWorkPerformed(page, boldFont, regularFont, timeEntries, yPosition, width) {
        page.drawRectangle({
            x: 30,
            y: yPosition - 25,
            width: width - 60,
            height: 20,
            color: this.colors.lightGray,
        });
        page.drawText('WORK PERFORMED', {
            x: 40,
            y: yPosition - 18,
            size: 12,
            font: boldFont,
            color: this.colors.primary,
        });
        yPosition -= 40;
        const workReports = timeEntries
            .filter(entry => entry.report && entry.report.trim())
            .map(entry => ({
            date: new Date(entry.date).toLocaleDateString(),
            technician: entry.technician ? `${entry.technician.firstName} ${entry.technician.lastName}` : 'N/A',
            report: entry.report,
        }));
        if (workReports.length === 0) {
            page.drawText('No detailed work reports available.', {
                x: 40,
                y: yPosition,
                size: 10,
                font: regularFont,
                color: this.colors.darkGray,
            });
            return yPosition - 30;
        }
        workReports.forEach((report, index) => {
            page.drawText(`${report.date} - ${report.technician}:`, {
                x: 40,
                y: yPosition,
                size: 10,
                font: boldFont,
                color: this.colors.text,
            });
            yPosition -= 15;
            const reportLines = this.wrapText(report.report, 90);
            const boxHeight = reportLines.length * 12 + 10;
            page.drawRectangle({
                x: 40,
                y: yPosition - boxHeight,
                width: width - 80,
                height: boxHeight,
                borderColor: this.colors.darkGray,
                borderWidth: 1,
                color: (0, pdf_lib_1.rgb)(0.99, 0.99, 0.99),
            });
            reportLines.forEach((line, lineIndex) => {
                page.drawText(line, {
                    x: 50,
                    y: yPosition - 10 - (lineIndex * 12),
                    size: 9,
                    font: regularFont,
                    color: this.colors.text,
                });
            });
            yPosition -= boxHeight + 15;
        });
        return yPosition - 10;
    }
    drawPartsSection(page, boldFont, regularFont, attachments, yPosition, width) {
        page.drawRectangle({
            x: 30,
            y: yPosition - 25,
            width: width - 60,
            height: 20,
            color: this.colors.lightGray,
        });
        page.drawText('PARTS & MATERIALS', {
            x: 40,
            y: yPosition - 18,
            size: 12,
            font: boldFont,
            color: this.colors.primary,
        });
        yPosition -= 40;
        page.drawText('Parts Ordered:', {
            x: 40,
            y: yPosition,
            size: 10,
            font: boldFont,
            color: this.colors.text,
        });
        yPosition -= 20;
        page.drawRectangle({
            x: 40,
            y: yPosition - 40,
            width: width - 80,
            height: 40,
            borderColor: this.colors.darkGray,
            borderWidth: 1,
        });
        page.drawText('(To be filled in manually)', {
            x: 50,
            y: yPosition - 25,
            size: 9,
            font: regularFont,
            color: this.colors.darkGray,
        });
        yPosition -= 50;
        page.drawText('Follow-up Required:', {
            x: 40,
            y: yPosition,
            size: 10,
            font: boldFont,
            color: this.colors.text,
        });
        yPosition -= 20;
        page.drawRectangle({
            x: 40,
            y: yPosition - 40,
            width: width - 80,
            height: 40,
            borderColor: this.colors.darkGray,
            borderWidth: 1,
        });
        return yPosition - 50;
    }
    drawComments(page, boldFont, regularFont, comments, yPosition, width) {
        page.drawRectangle({
            x: 30,
            y: yPosition - 25,
            width: width - 60,
            height: 20,
            color: this.colors.lightGray,
        });
        page.drawText('ADDITIONAL COMMENTS', {
            x: 40,
            y: yPosition - 18,
            size: 12,
            font: boldFont,
            color: this.colors.primary,
        });
        yPosition -= 40;
        const recentComments = comments.slice(-3);
        recentComments.forEach((comment, index) => {
            const commentText = `${comment.author.firstName} ${comment.author.lastName} (${new Date(comment.createdAt).toLocaleDateString()}):`;
            page.drawText(commentText, {
                x: 40,
                y: yPosition,
                size: 9,
                font: boldFont,
                color: this.colors.text,
            });
            yPosition -= 15;
            const commentLines = this.wrapText(comment.content, 85);
            commentLines.forEach((line, lineIndex) => {
                page.drawText(line, {
                    x: 50,
                    y: yPosition - (lineIndex * 12),
                    size: 9,
                    font: regularFont,
                    color: this.colors.text,
                });
            });
            yPosition -= commentLines.length * 12 + 10;
        });
        return yPosition;
    }
    drawSignatureSection(page, boldFont, regularFont, workOrder, yPosition, width) {
        page.drawRectangle({
            x: 30,
            y: yPosition - 25,
            width: width - 60,
            height: 20,
            color: this.colors.lightGray,
        });
        page.drawText('AUTHORIZATION & SIGNATURES', {
            x: 40,
            y: yPosition - 18,
            size: 12,
            font: boldFont,
            color: this.colors.primary,
        });
        yPosition -= 45;
        const leftColumn = 40;
        const rightColumn = 320;
        const boxWidth = 250;
        const boxHeight = 50;
        page.drawText('Client Signature:', {
            x: leftColumn,
            y: yPosition,
            size: 10,
            font: boldFont,
            color: this.colors.text,
        });
        page.drawRectangle({
            x: leftColumn,
            y: yPosition - boxHeight - 10,
            width: boxWidth,
            height: boxHeight,
            borderColor: this.colors.darkGray,
            borderWidth: 1,
        });
        page.drawText('Purchase Order #:', {
            x: rightColumn,
            y: yPosition,
            size: 10,
            font: boldFont,
            color: this.colors.text,
        });
        page.drawRectangle({
            x: rightColumn,
            y: yPosition - 30,
            width: boxWidth,
            height: 25,
            borderColor: this.colors.darkGray,
            borderWidth: 1,
        });
        yPosition -= boxHeight + 20;
        page.drawText('Printed Name:', {
            x: leftColumn,
            y: yPosition,
            size: 10,
            font: boldFont,
            color: this.colors.text,
        });
        page.drawLine({
            start: { x: leftColumn + 80, y: yPosition - 5 },
            end: { x: leftColumn + 200, y: yPosition - 5 },
            thickness: 1,
            color: this.colors.darkGray,
        });
        page.drawText('Date:', {
            x: rightColumn,
            y: yPosition,
            size: 10,
            font: boldFont,
            color: this.colors.text,
        });
        page.drawLine({
            start: { x: rightColumn + 35, y: yPosition - 5 },
            end: { x: rightColumn + 150, y: yPosition - 5 },
            thickness: 1,
            color: this.colors.darkGray,
        });
        return yPosition - 30;
    }
    drawFooter(page, regularFont, width, yPosition, pageNumber, totalPages) {
        page.drawLine({
            start: { x: this.spacing.pageMargin, y: yPosition + 15 },
            end: { x: width - this.spacing.pageMargin, y: yPosition + 15 },
            thickness: 1,
            color: this.colors.border,
        });
        const generationDate = new Date();
        const dateStr = generationDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const timeStr = generationDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        page.drawText(`Generated: ${dateStr} at ${timeStr}`, {
            x: this.spacing.pageMargin,
            y: yPosition,
            size: this.fonts.footer,
            font: regularFont,
            color: this.colors.darkGray,
        });
        const brandText = 'Work Order Management System';
        const brandWidth = brandText.length * (this.fonts.footer * 0.6);
        page.drawText(brandText, {
            x: (width - brandWidth) / 2,
            y: yPosition,
            size: this.fonts.footer,
            font: regularFont,
            color: this.colors.darkGray,
        });
        const pageText = `Page ${pageNumber} of ${totalPages}`;
        const pageWidth = pageText.length * (this.fonts.footer * 0.6);
        page.drawText(pageText, {
            x: width - this.spacing.pageMargin - pageWidth,
            y: yPosition,
            size: this.fonts.footer,
            font: regularFont,
            color: this.colors.darkGray,
        });
    }
    getStatusColor(status) {
        switch (status.toLowerCase()) {
            case 'completed':
                return this.colors.success;
            case 'in_progress':
                return this.colors.warning;
            case 'cancelled':
                return this.colors.error;
            default:
                return this.colors.primary;
        }
    }
    formatTimeEntryType(type) {
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    wrapText(text, maxWidth) {
        if (!text)
            return [''];
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (testLine.length <= maxWidth) {
                currentLine = testLine;
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
        return lines.length > 0 ? lines : [''];
    }
    formatFileSize(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    estimateWorkPerformedHeight(timeEntries) {
        const workReports = timeEntries.filter(entry => entry.report && entry.report.trim());
        if (workReports.length === 0)
            return 60;
        let totalHeight = 50;
        workReports.forEach(report => {
            const reportLines = this.wrapText(report.report, 90);
            totalHeight += 25 + reportLines.length * 12 + 25;
        });
        return totalHeight;
    }
    drawPageContinuationHeader(page, boldFont, regularFont, workOrder, yPosition, width) {
        page.drawRectangle({
            x: 30,
            y: yPosition - 70,
            width: width - 60,
            height: 60,
            color: this.colors.primary,
        });
        page.drawText('WORK ORDER MANAGEMENT SYSTEM', {
            x: 45,
            y: yPosition - 30,
            size: 20,
            font: boldFont,
            color: (0, pdf_lib_1.rgb)(1, 1, 1),
        });
        page.drawText('Professional Work Order Report', {
            x: 45,
            y: yPosition - 50,
            size: 12,
            font: regularFont,
            color: (0, pdf_lib_1.rgb)(0.9, 0.9, 0.9),
        });
        const woTitle = 'WORK ORDER';
        const woTitleWidth = woTitle.length * 14;
        page.drawText(woTitle, {
            x: width - woTitleWidth - 45,
            y: yPosition - 35,
            size: 24,
            font: boldFont,
            color: this.colors.accent,
        });
        const statusColor = this.getStatusColor(workOrder.status);
        const statusText = workOrder.status.toUpperCase().replace('_', ' ');
        page.drawRectangle({
            x: width - 150,
            y: yPosition - 60,
            width: 100,
            height: 15,
            color: statusColor,
        });
        page.drawText(statusText, {
            x: width - 145,
            y: yPosition - 57,
            size: 8,
            font: boldFont,
            color: (0, pdf_lib_1.rgb)(1, 1, 1),
        });
    }
};
exports.PdfReportService = PdfReportService;
exports.PdfReportService = PdfReportService = PdfReportService_1 = __decorate([
    (0, common_1.Injectable)()
], PdfReportService);
//# sourceMappingURL=pdf-report.service.js.map