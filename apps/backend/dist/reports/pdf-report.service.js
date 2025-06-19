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
    }
    async generateWorkOrderCompletionReport(workOrder, assignedTechnician, requester, asset, comments, attachments) {
        try {
            const pdfDoc = await pdf_lib_1.PDFDocument.create();
            const page = pdfDoc.addPage([595.28, 841.89]);
            const { width, height } = page.getSize();
            const font = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
            const primaryColor = (0, pdf_lib_1.rgb)(0.2, 0.4, 0.8);
            const secondaryColor = (0, pdf_lib_1.rgb)(0.4, 0.4, 0.4);
            const successColor = (0, pdf_lib_1.rgb)(0.2, 0.6, 0.2);
            page.drawText('WORK ORDER COMPLETION REPORT', {
                x: 50,
                y: height - 50,
                size: 24,
                font: boldFont,
                color: primaryColor,
            });
            let yPosition = height - 100;
            page.drawText('Work Order Details:', {
                x: 50,
                y: yPosition,
                size: 16,
                font: boldFont,
                color: primaryColor,
            });
            yPosition -= 30;
            page.drawText(`Work Order Number: ${workOrder.workOrderNumber}`, {
                x: 50,
                y: yPosition,
                size: 12,
                font: font,
            });
            yPosition -= 20;
            page.drawText(`Title: ${workOrder.title}`, {
                x: 50,
                y: yPosition,
                size: 12,
                font: font,
            });
            yPosition -= 20;
            page.drawText(`Status: ${workOrder.status.toUpperCase()}`, {
                x: 50,
                y: yPosition,
                size: 12,
                font: boldFont,
                color: workOrder.status === 'completed' ? successColor : secondaryColor,
            });
            yPosition -= 20;
            page.drawText(`Priority: ${workOrder.priority.toUpperCase()}`, {
                x: 50,
                y: yPosition,
                size: 12,
                font: font,
            });
            yPosition -= 20;
            page.drawText(`Type: ${workOrder.type.toUpperCase()}`, {
                x: 50,
                y: yPosition,
                size: 12,
                font: font,
            });
            yPosition -= 30;
            page.drawText('Timeline:', {
                x: 50,
                y: yPosition,
                size: 14,
                font: boldFont,
                color: primaryColor,
            });
            yPosition -= 25;
            page.drawText(`Created: ${new Date(workOrder.createdAt).toLocaleDateString()}`, {
                x: 50,
                y: yPosition,
                size: 11,
                font: font,
            });
            yPosition -= 18;
            if (workOrder.scheduledStartDate) {
                page.drawText(`Scheduled: ${new Date(workOrder.scheduledStartDate).toLocaleDateString()}`, {
                    x: 50,
                    y: yPosition,
                    size: 11,
                    font: font,
                });
                yPosition -= 18;
            }
            if (workOrder.actualEndDate) {
                page.drawText(`Completed: ${new Date(workOrder.actualEndDate).toLocaleDateString()}`, {
                    x: 50,
                    y: yPosition,
                    size: 11,
                    font: font,
                });
                yPosition -= 18;
            }
            yPosition -= 20;
            if (workOrder.description) {
                page.drawText('Description:', {
                    x: 50,
                    y: yPosition,
                    size: 14,
                    font: boldFont,
                    color: primaryColor,
                });
                yPosition -= 25;
                const descriptionLines = this.wrapText(workOrder.description, 80);
                for (const line of descriptionLines) {
                    page.drawText(line, {
                        x: 50,
                        y: yPosition,
                        size: 11,
                        font: font,
                    });
                    yPosition -= 16;
                }
                yPosition -= 10;
            }
            page.drawText('People Involved:', {
                x: 50,
                y: yPosition,
                size: 14,
                font: boldFont,
                color: primaryColor,
            });
            yPosition -= 25;
            page.drawText(`Requester: ${requester ? `${requester.firstName} ${requester.lastName} (${requester.email})` : 'Not specified'}`, {
                x: 50,
                y: yPosition,
                size: 11,
                font: font,
            });
            yPosition -= 18;
            if (assignedTechnician) {
                page.drawText(`Assigned Technician: ${assignedTechnician.firstName} ${assignedTechnician.lastName} (${assignedTechnician.email})`, {
                    x: 50,
                    y: yPosition,
                    size: 11,
                    font: font,
                });
                yPosition -= 18;
            }
            yPosition -= 20;
            if (asset) {
                page.drawText('Asset Information:', {
                    x: 50,
                    y: yPosition,
                    size: 14,
                    font: boldFont,
                    color: primaryColor,
                });
                yPosition -= 25;
                page.drawText(`Asset: ${asset.name} (${asset.assetNumber})`, {
                    x: 50,
                    y: yPosition,
                    size: 11,
                    font: font,
                });
                yPosition -= 18;
                if (asset.location) {
                    page.drawText(`Location: ${asset.location}`, {
                        x: 50,
                        y: yPosition,
                        size: 11,
                        font: font,
                    });
                    yPosition -= 18;
                }
                if (asset.category) {
                    page.drawText(`Category: ${asset.category.toUpperCase()}`, {
                        x: 50,
                        y: yPosition,
                        size: 11,
                        font: font,
                    });
                    yPosition -= 18;
                }
                yPosition -= 20;
            }
            if (workOrder.customer) {
                page.drawText('Customer Information:', {
                    x: 50,
                    y: yPosition,
                    size: 14,
                    font: boldFont,
                    color: primaryColor,
                });
                yPosition -= 25;
                page.drawText(`Customer: ${workOrder.customer.name}`, {
                    x: 50,
                    y: yPosition,
                    size: 11,
                    font: font,
                });
                yPosition -= 18;
                if (workOrder.customer.address) {
                    const addressLines = this.wrapText(workOrder.customer.address, 80);
                    for (const line of addressLines) {
                        page.drawText(`Address: ${line}`, {
                            x: 50,
                            y: yPosition,
                            size: 11,
                            font: font,
                        });
                        yPosition -= 16;
                    }
                }
                if (workOrder.customer.primaryContactName) {
                    page.drawText(`Primary Contact: ${workOrder.customer.primaryContactName}`, {
                        x: 50,
                        y: yPosition,
                        size: 11,
                        font: font,
                    });
                    yPosition -= 18;
                    if (workOrder.customer.primaryContactPhone) {
                        page.drawText(`  Phone: ${workOrder.customer.primaryContactPhone}`, {
                            x: 50,
                            y: yPosition,
                            size: 11,
                            font: font,
                        });
                        yPosition -= 16;
                    }
                    if (workOrder.customer.primaryContactEmail) {
                        page.drawText(`  Email: ${workOrder.customer.primaryContactEmail}`, {
                            x: 50,
                            y: yPosition,
                            size: 11,
                            font: font,
                        });
                        yPosition -= 16;
                    }
                }
                if (workOrder.customer.secondaryContactName) {
                    page.drawText(`Secondary Contact: ${workOrder.customer.secondaryContactName}`, {
                        x: 50,
                        y: yPosition,
                        size: 11,
                        font: font,
                    });
                    yPosition -= 18;
                    if (workOrder.customer.secondaryContactPhone) {
                        page.drawText(`  Phone: ${workOrder.customer.secondaryContactPhone}`, {
                            x: 50,
                            y: yPosition,
                            size: 11,
                            font: font,
                        });
                        yPosition -= 16;
                    }
                    if (workOrder.customer.secondaryContactEmail) {
                        page.drawText(`  Email: ${workOrder.customer.secondaryContactEmail}`, {
                            x: 50,
                            y: yPosition,
                            size: 11,
                            font: font,
                        });
                        yPosition -= 16;
                    }
                }
                yPosition -= 20;
            }
            if (workOrder.estimatedHours || workOrder.estimatedCost) {
                page.drawText('Estimates:', {
                    x: 50,
                    y: yPosition,
                    size: 14,
                    font: boldFont,
                    color: primaryColor,
                });
                yPosition -= 25;
                if (workOrder.estimatedHours) {
                    page.drawText(`Estimated Hours: ${workOrder.estimatedHours}`, {
                        x: 50,
                        y: yPosition,
                        size: 11,
                        font: font,
                    });
                    yPosition -= 18;
                }
                if (workOrder.estimatedCost) {
                    page.drawText(`Estimated Cost: $${workOrder.estimatedCost.toFixed(2)}`, {
                        x: 50,
                        y: yPosition,
                        size: 11,
                        font: font,
                    });
                    yPosition -= 18;
                }
                yPosition -= 20;
            }
            if (comments && comments.length > 0) {
                page.drawText('Comments:', {
                    x: 50,
                    y: yPosition,
                    size: 14,
                    font: boldFont,
                    color: primaryColor,
                });
                yPosition -= 25;
                for (const comment of comments.slice(0, 5)) {
                    const commentText = `${comment.author.firstName} ${comment.author.lastName} - ${new Date(comment.createdAt).toLocaleDateString()}:`;
                    page.drawText(commentText, {
                        x: 50,
                        y: yPosition,
                        size: 10,
                        font: boldFont,
                        color: secondaryColor,
                    });
                    yPosition -= 15;
                    const commentLines = this.wrapText(comment.content, 90);
                    for (const line of commentLines) {
                        page.drawText(line, {
                            x: 60,
                            y: yPosition,
                            size: 10,
                            font: font,
                        });
                        yPosition -= 14;
                    }
                    yPosition -= 10;
                }
            }
            if (attachments && attachments.length > 0) {
                page.drawText('Attachments:', {
                    x: 50,
                    y: yPosition,
                    size: 14,
                    font: boldFont,
                    color: primaryColor,
                });
                yPosition -= 25;
                for (const attachment of attachments) {
                    page.drawText(`• ${attachment.originalName} (${this.formatFileSize(attachment.fileSize)})`, {
                        x: 50,
                        y: yPosition,
                        size: 10,
                        font: font,
                    });
                    yPosition -= 15;
                }
            }
            const footerY = 50;
            page.drawText(`Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, {
                x: 50,
                y: footerY,
                size: 10,
                font: font,
                color: secondaryColor,
            });
            page.drawText('Work Order Management System', {
                x: width - 200,
                y: footerY,
                size: 10,
                font: font,
                color: secondaryColor,
            });
            const pdfBytes = await pdfDoc.save();
            return Buffer.from(pdfBytes);
        }
        catch (error) {
            this.logger.error('Error generating PDF report:', error);
            throw new Error('Failed to generate PDF report');
        }
    }
    wrapText(text, maxWidth) {
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
        return lines;
    }
    formatFileSize(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};
exports.PdfReportService = PdfReportService;
exports.PdfReportService = PdfReportService = PdfReportService_1 = __decorate([
    (0, common_1.Injectable)()
], PdfReportService);
//# sourceMappingURL=pdf-report.service.js.map