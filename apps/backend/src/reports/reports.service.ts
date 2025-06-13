import { Injectable } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { WorkOrdersService, DashboardStats } from '../work-orders/work-orders.service';
import { AssetsService } from '../assets/assets.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly workOrdersService: WorkOrdersService,
    private readonly assetsService: AssetsService,
    private readonly usersService: UsersService,
  ) {}

  async generateWorkOrderPdf(workOrderId: string): Promise<Buffer> {
    const workOrder = await this.workOrdersService.findById(workOrderId);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    // Add a page
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const fontSize = 12;
    const titleFontSize = 18;

    let yPosition = height - 50;

    // Title
    page.drawText('Work Order Report', {
      x: 50,
      y: yPosition,
      size: titleFontSize,
      font: timesRomanBoldFont,
      color: rgb(0, 0, 0),
    });

    yPosition -= 40;

    // Work Order Details
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
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
    }

    yPosition -= 20;

    // Description
    page.drawText('Description:', {
      x: 50,
      y: yPosition,
      size: fontSize,
      font: timesRomanBoldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;

    // Split description into lines to fit page width
    const descriptionLines = this.splitTextIntoLines(workOrder.description, 80);
    for (const line of descriptionLines) {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: fontSize,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
    }

    // Comments section
    if (workOrder.comments && workOrder.comments.length > 0) {
      yPosition -= 20;
      page.drawText('Comments:', {
        x: 50,
        y: yPosition,
        size: fontSize,
        font: timesRomanBoldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;

      for (const comment of workOrder.comments) {
        if (yPosition < 100) {
          // Add new page if needed
          const newPage = pdfDoc.addPage();
          yPosition = height - 50;
        }

        page.drawText(`${comment.author?.fullName || 'Unknown'} - ${comment.createdAt.toLocaleDateString()}:`, {
          x: 50,
          y: yPosition,
          size: fontSize - 1,
          font: timesRomanBoldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 15;

        const commentLines = this.splitTextIntoLines(comment.content, 80);
        for (const line of commentLines) {
          page.drawText(line, {
            x: 70,
            y: yPosition,
            size: fontSize - 1,
            font: timesRomanFont,
            color: rgb(0, 0, 0),
          });
          yPosition -= 15;
        }
        yPosition -= 10;
      }
    }

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  async generateCompletionReport(
    workOrderId: string,
    signature: string,
    completionNotes?: string,
  ): Promise<Buffer> {
    const workOrder = await this.workOrdersService.findById(workOrderId);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    // Add a page
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const fontSize = 12;
    const titleFontSize = 18;

    let yPosition = height - 50;

    // Title
    page.drawText('Work Order Completion Report', {
      x: 50,
      y: yPosition,
      size: titleFontSize,
      font: timesRomanBoldFont,
      color: rgb(0, 0, 0),
    });

    yPosition -= 40;

    // Basic info
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
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
    }

    yPosition -= 20;

    // Completion Notes
    if (completionNotes) {
      page.drawText('Completion Notes:', {
        x: 50,
        y: yPosition,
        size: fontSize,
        font: timesRomanBoldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;

      const notesLines = this.splitTextIntoLines(completionNotes, 80);
      for (const line of notesLines) {
        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: fontSize,
          font: timesRomanFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 15;
      }
    }

    yPosition -= 40;

    // Signature section
    page.drawText('Technician Signature:', {
      x: 50,
      y: yPosition,
      size: fontSize,
      font: timesRomanBoldFont,
      color: rgb(0, 0, 0),
    });

    // Draw signature box
    page.drawRectangle({
      x: 50,
      y: yPosition - 60,
      width: 200,
      height: 50,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // Note: In a real implementation, you would decode and embed the signature image
    page.drawText('[Signature]', {
      x: 120,
      y: yPosition - 40,
      size: fontSize,
      font: timesRomanFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  async generateMaintenanceScheduleReport(): Promise<Buffer> {
    const assets = await this.assetsService.findMaintenanceDue();

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    // Add a page
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const fontSize = 12;
    const titleFontSize = 18;

    let yPosition = height - 50;

    // Title
    page.drawText('Asset Maintenance Schedule', {
      x: 50,
      y: yPosition,
      size: titleFontSize,
      font: timesRomanBoldFont,
      color: rgb(0, 0, 0),
    });

    yPosition -= 40;

    page.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
      x: 50,
      y: yPosition,
      size: fontSize,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });

    yPosition -= 40;

    // Table headers
    const headers = ['Asset', 'Category', 'Location', 'Next Maintenance'];
    let xPosition = 50;
    for (const header of headers) {
      page.drawText(header, {
        x: xPosition,
        y: yPosition,
        size: fontSize,
        font: timesRomanBoldFont,
        color: rgb(0, 0, 0),
      });
      xPosition += 120;
    }

    yPosition -= 20;

    // Draw line under headers
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    yPosition -= 20;

    // Asset data
    for (const asset of assets) {
      if (yPosition < 100) {
        // Add new page if needed
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
          color: rgb(0, 0, 0),
        });
        xPosition += 120;
      }
      yPosition -= 20;
    }

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  async generateDashboardSummaryReport(): Promise<Buffer> {
    const stats: DashboardStats = await this.workOrdersService.getDashboardStats();

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    // Add a page
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const fontSize = 12;
    const titleFontSize = 18;

    let yPosition = height - 50;

    // Title
    page.drawText('Dashboard Summary Report', {
      x: 50,
      y: yPosition,
      size: titleFontSize,
      font: timesRomanBoldFont,
      color: rgb(0, 0, 0),
    });

    yPosition -= 40;

    page.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
      x: 50,
      y: yPosition,
      size: fontSize,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });

    yPosition -= 40;

    // Statistics
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
        color: rgb(0, 0, 0),
      });
      yPosition -= 25;
    }

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  private splitTextIntoLines(text: string, maxCharsPerLine: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
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
} 