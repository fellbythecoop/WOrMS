import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { WorkOrder } from '../work-orders/entities/work-order.entity';
import { User } from '../users/entities/user.entity';
import { Asset } from '../assets/entities/asset.entity';
import { WorkOrderComment } from '../work-orders/entities/work-order-comment.entity';
import { WorkOrderAttachment } from '../work-orders/entities/work-order-attachment.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfReportService {
  private readonly logger = new Logger(PdfReportService.name);

  async generateWorkOrderCompletionReport(
    workOrder: WorkOrder,
    assignedTechnician: User | null,
    requester: User | null,
    asset?: Asset,
    comments?: WorkOrderComment[],
    attachments?: WorkOrderAttachment[],
  ): Promise<Buffer> {
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const { width, height } = page.getSize();

      // Embed the standard font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Define colors
      const primaryColor = rgb(0.2, 0.4, 0.8);
      const secondaryColor = rgb(0.4, 0.4, 0.4);
      const successColor = rgb(0.2, 0.6, 0.2);

      // Header
      page.drawText('WORK ORDER COMPLETION REPORT', {
        x: 50,
        y: height - 50,
        size: 24,
        font: boldFont,
        color: primaryColor,
      });

      // Work Order Information Section
      let yPosition = height - 100;

      // Work Order Number and Status
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

      // Dates
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

      // Description
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

      // People Involved
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

      // Asset Information
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

      // Customer Information
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

      // Estimates and Costs
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

      // Comments
      if (comments && comments.length > 0) {
        page.drawText('Comments:', {
          x: 50,
          y: yPosition,
          size: 14,
          font: boldFont,
          color: primaryColor,
        });
        yPosition -= 25;

        for (const comment of comments.slice(0, 5)) { // Limit to first 5 comments
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

      // Attachments
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

      // Footer
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

      // Serialize the PDF
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);

    } catch (error) {
      this.logger.error('Error generating PDF report:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxWidth) {
        currentLine = testLine;
      } else {
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

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
} 