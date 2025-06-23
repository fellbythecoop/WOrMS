import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont, RGB } from 'pdf-lib';
import { WorkOrder } from '../work-orders/entities/work-order.entity';
import { User } from '../users/entities/user.entity';
import { Asset } from '../assets/entities/asset.entity';
import { WorkOrderComment } from '../work-orders/entities/work-order-comment.entity';
import { WorkOrderAttachment } from '../work-orders/entities/work-order-attachment.entity';
import { WorkOrderTimeEntry } from '../work-orders/entities/work-order-time-entry.entity';
import * as fs from 'fs';
import * as path from 'path';

interface Colors {
  primary: RGB;
  secondary: RGB;
  accent: RGB;
  success: RGB;
  warning: RGB;
  error: RGB;
  text: RGB;
  lightGray: RGB;
  darkGray: RGB;
  white: RGB;
  border: RGB;
  tableHeader: RGB;
  tableRowAlt: RGB;
}

@Injectable()
export class PdfReportService {
  private readonly logger = new Logger(PdfReportService.name);

  // Enhanced professional color scheme
  private readonly colors: Colors = {
    primary: rgb(0.06, 0.25, 0.49),     // Professional navy blue
    secondary: rgb(0.97, 0.97, 0.97),   // Light gray background
    accent: rgb(0.8, 0.33, 0.0),        // Professional orange
    success: rgb(0.13, 0.59, 0.33),     // Professional green
    warning: rgb(0.85, 0.65, 0.13),     // Professional amber
    error: rgb(0.8, 0.24, 0.24),        // Professional red
    text: rgb(0.2, 0.2, 0.2),           // Dark charcoal
    lightGray: rgb(0.95, 0.95, 0.95),   // Light gray
    darkGray: rgb(0.5, 0.5, 0.5),       // Medium gray
    white: rgb(1, 1, 1),                // Pure white
    border: rgb(0.8, 0.8, 0.8),         // Light border
    tableHeader: rgb(0.92, 0.92, 0.92), // Table header background
    tableRowAlt: rgb(0.98, 0.98, 0.98), // Alternate row color
  };

  // Professional spacing and sizing constants
  private readonly spacing = {
    pageMargin: 50,
    sectionSpacing: 25,
    lineHeight: 16,
    headerHeight: 80,
    sectionHeaderHeight: 24,
  };

  private readonly fonts = {
    title: 18,
    sectionHeader: 11,
    fieldLabel: 9,
    fieldValue: 9,
    tableHeader: 8,
    tableData: 8,
    footer: 7,
  };

  async generateWorkOrderCompletionReport(
    workOrder: WorkOrder,
    assignedTechnician: User | null,
    requester: User | null,
    asset?: Asset,
    comments?: WorkOrderComment[],
    attachments?: WorkOrderAttachment[],
    additionalAssignees?: User[],
  ): Promise<Buffer> {
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      let currentPage = pdfDoc.addPage([612, 792]); // US Letter size (8.5" x 11")
      const { width, height } = currentPage.getSize();

      // Embed fonts
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

      let yPosition = height - this.spacing.pageMargin; // Professional margin
      
      // Header Section
      yPosition = this.drawHeader(currentPage, boldFont, regularFont, workOrder, yPosition, width);
      
      // Work Order Information Grid
      yPosition = this.drawWorkOrderInfo(currentPage, boldFont, regularFont, workOrder, asset, yPosition, width);
      
      // Personnel Information
      yPosition = this.drawPersonnelInfo(currentPage, boldFont, regularFont, workOrder, assignedTechnician, yPosition, width, additionalAssignees);
      
      // Work Description Section
      yPosition = this.drawWorkDescription(currentPage, boldFont, regularFont, workOrder, yPosition, width);
      
      // Time Tracking Section
      if (workOrder.timeEntries && workOrder.timeEntries.length > 0) {
        yPosition = this.drawTimeTracking(currentPage, boldFont, regularFont, workOrder.timeEntries, yPosition, width);
      }
      
      // Check if we need a new page for work performed section
      const estimatedWorkPerformedHeight = this.estimateWorkPerformedHeight(workOrder.timeEntries || []);
      if (yPosition - estimatedWorkPerformedHeight < 200) { // More conservative space requirement
        // Add new page for work performed
        currentPage = pdfDoc.addPage([612, 792]);
        yPosition = height - this.spacing.pageMargin;
        
        // Professional page continuation header
        this.drawPageContinuationHeader(currentPage, boldFont, regularFont, workOrder, yPosition, width);
        yPosition -= this.spacing.headerHeight;
      }
      
      // Work Performed Section (from time entry reports)
      yPosition = this.drawWorkPerformed(currentPage, boldFont, regularFont, workOrder.timeEntries || [], yPosition, width);
      
      // Parts and Materials
      yPosition = this.drawPartsSection(currentPage, boldFont, regularFont, attachments || [], yPosition, width);
      
      // Comments Section
      if (comments && comments.length > 0) {
        yPosition = this.drawComments(currentPage, boldFont, regularFont, comments, yPosition, width);
      }
      
      // Check if we need another page for signatures
      if (yPosition < 250) { // Professional space for signatures
        currentPage = pdfDoc.addPage([612, 792]);
        yPosition = height - this.spacing.pageMargin;
        
        // Signature page header
        this.drawPageContinuationHeader(currentPage, boldFont, regularFont, workOrder, yPosition, width);
        yPosition -= this.spacing.headerHeight;
      }
      
      // Signature Section
      yPosition = this.drawSignatureSection(currentPage, boldFont, regularFont, workOrder, yPosition, width);
      
      // Footer on all pages with page numbers
      const pages = pdfDoc.getPages();
      pages.forEach((page, index) => {
        this.drawFooter(page, regularFont, width, this.spacing.pageMargin, index + 1, pages.length);
      });

      // Serialize the PDF
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);

    } catch (error) {
      this.logger.error('Error generating PDF report:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  private drawHeader(page: PDFPage, boldFont: PDFFont, regularFont: PDFFont, workOrder: WorkOrder, yPosition: number, width: number): number {
    // Professional header with subtle shadow effect
    page.drawRectangle({
      x: this.spacing.pageMargin + 2,
      y: yPosition - this.spacing.headerHeight + 2,
      width: width - (2 * this.spacing.pageMargin),
      height: this.spacing.headerHeight,
      color: rgb(0.9, 0.9, 0.9), // Shadow
    });

    page.drawRectangle({
      x: this.spacing.pageMargin,
      y: yPosition - this.spacing.headerHeight,
      width: width - (2 * this.spacing.pageMargin),
      height: this.spacing.headerHeight,
      color: this.colors.primary,
    });

    // Company branding
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
      color: rgb(0.9, 0.9, 0.9),
    });

    // Work Order title with professional styling
    const woTitle = 'WORK ORDER';
    page.drawText(woTitle, {
      x: width - 200,
      y: yPosition - 40,
      size: 22,
      font: boldFont,
      color: this.colors.accent,
    });

    // Enhanced status badge
    const statusColor = this.getStatusColor(workOrder.status);
    const statusText = workOrder.status.toUpperCase().replace('_', ' ');
    
    // Status badge background with rounded effect
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

    // Professional border line
    page.drawLine({
      start: { x: this.spacing.pageMargin, y: yPosition - this.spacing.headerHeight - 5 },
      end: { x: width - this.spacing.pageMargin, y: yPosition - this.spacing.headerHeight - 5 },
      thickness: 2,
      color: this.colors.accent,
    });

    return yPosition - this.spacing.headerHeight - 15;
  }

  private drawWorkOrderInfo(page: PDFPage, boldFont: PDFFont, regularFont: PDFFont, workOrder: WorkOrder, asset: Asset | undefined, yPosition: number, width: number): number {
    // Professional section header
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

    // Professional card-like container
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

    // Information layout with better spacing
    const leftColumn = this.spacing.pageMargin + 20;
    const rightColumn = width / 2 + 20;

    // Job Number
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
      size: this.fonts.fieldValue + 2, // Slightly larger for emphasis
      font: boldFont,
      color: this.colors.text,
    });

    // Equipment ID
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
      size: this.fonts.fieldValue + 2, // Slightly larger for emphasis
      font: boldFont,
      color: this.colors.text,
    });

    return yPosition - cardHeight - this.spacing.sectionSpacing;
  }

  private drawPersonnelInfo(page: PDFPage, boldFont: PDFFont, regularFont: PDFFont, workOrder: WorkOrder, assignedTechnician: User | null, yPosition: number, width: number, additionalAssignees: User[] = []): number {
    // Professional section header
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

    // Calculate card height based on content
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

    // Professional dual-card layout
    const cardWidth = (width - 3 * this.spacing.pageMargin) / 2;

    // Personnel card
    page.drawRectangle({
      x: this.spacing.pageMargin,
      y: yPosition - cardHeight,
      width: cardWidth,
      height: cardHeight,
      color: this.colors.white,
      borderColor: this.colors.border,
      borderWidth: 1,
    });

    // Personnel header
    page.drawRectangle({
      x: this.spacing.pageMargin,
      y: yPosition - 25,
      width: cardWidth,
      height: 20,
      color: rgb(0.94, 0.97, 1), // Light blue tint
    });

    page.drawText('Team Members', {
      x: this.spacing.pageMargin + 10,
      y: yPosition - 18,
      size: this.fonts.fieldLabel + 1,
      font: boldFont,
      color: this.colors.primary,
    });

    // Personnel content
    if (personnelInfo.length === 0) {
      page.drawText('No personnel assigned', {
        x: this.spacing.pageMargin + 10,
        y: yPosition - 45,
        size: this.fonts.fieldValue,
        font: regularFont,
        color: this.colors.darkGray,
      });
    } else {
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

    // Customer card
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

    // Customer header
    page.drawRectangle({
      x: customerCardX,
      y: yPosition - 25,
      width: cardWidth,
      height: 20,
      color: rgb(0.94, 1, 0.94), // Light green tint
    });

    page.drawText('Customer Information', {
      x: customerCardX + 10,
      y: yPosition - 18,
      size: this.fonts.fieldLabel + 1,
      font: boldFont,
      color: this.colors.primary,
    });

    // Customer content
    if (customerInfo.length === 0) {
      page.drawText('No customer information', {
        x: customerCardX + 10,
        y: yPosition - 45,
        size: this.fonts.fieldValue,
        font: regularFont,
        color: this.colors.darkGray,
      });
    } else {
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

        // Wrap address text if too long
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

  private drawWorkDescription(page: PDFPage, boldFont: PDFFont, regularFont: PDFFont, workOrder: WorkOrder, yPosition: number, width: number): number {
    // Section header
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

    // Work description
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

    // Draw description in a box
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

  private drawTimeTracking(page: PDFPage, boldFont: PDFFont, regularFont: PDFFont, timeEntries: WorkOrderTimeEntry[], yPosition: number, width: number): number {
    // Professional section header
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

    // Professional table layout
    const tableStartY = yPosition;
    const rowHeight = 22;
    const headerHeight = 26;
    const tableWidth = width - (2 * this.spacing.pageMargin);
    
    // Column definitions with better proportions
    const columns = [
      { label: 'Technician', width: tableWidth * 0.25, x: this.spacing.pageMargin },
      { label: 'Date', width: tableWidth * 0.15, x: 0 },
      { label: 'Type', width: tableWidth * 0.2, x: 0 },
      { label: 'Hours', width: tableWidth * 0.12, x: 0 },
      { label: 'Rate', width: tableWidth * 0.13, x: 0 },
      { label: 'Total', width: tableWidth * 0.15, x: 0 },
    ];

    // Calculate X positions
    for (let i = 1; i < columns.length; i++) {
      columns[i].x = columns[i - 1].x + columns[i - 1].width;
    }
    
    // Table header with professional styling
    page.drawRectangle({
      x: this.spacing.pageMargin,
      y: tableStartY - headerHeight,
      width: tableWidth,
      height: headerHeight,
      color: this.colors.primary,
      borderColor: this.colors.border,
      borderWidth: 1,
    });

    // Draw column headers
    columns.forEach((col) => {
      // Vertical separator lines
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

    // Data rows with professional styling
    timeEntries.forEach((entry, index) => {
      const rowY = currentRowY - (index * rowHeight);
      
      // Alternating row colors for better readability
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

      // Row data
      const rowData = [
        entry.technician ? `${entry.technician.firstName} ${entry.technician.lastName}` : 'N/A',
        new Date(entry.date).toLocaleDateString(),
        this.formatTimeEntryType(entry.timeEntryType),
        entry.hours.toString(),
        entry.rate ? `$${entry.rate.toFixed(2)}` : 'N/A',
        entry.totalAmount ? `$${entry.totalAmount.toFixed(2)}` : 'N/A',
      ];

      // Draw column separators and data
      columns.forEach((col, colIndex) => {
        // Vertical separator lines
        if (col.x > this.spacing.pageMargin) {
          page.drawLine({
            start: { x: col.x, y: rowY },
            end: { x: col.x, y: rowY - rowHeight },
            thickness: 0.5,
            color: this.colors.border,
          });
        }

        // Center numbers, left-align text
        const isNumeric = colIndex >= 3; // Hours, Rate, Total columns
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

    // Professional totals row
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

    // Total label
    page.drawText('TOTALS:', {
      x: columns[2].x + 8,
      y: totalRowY - 15,
      size: this.fonts.tableHeader + 1,
      font: boldFont,
      color: this.colors.primary,
    });

    // Total hours
    page.drawText(totalHours.toFixed(1), {
      x: columns[3].x + columns[3].width - 40,
      y: totalRowY - 15,
      size: this.fonts.tableHeader + 1,
      font: boldFont,
      color: this.colors.primary,
    });

    // Total cost
    page.drawText(`$${totalCost.toFixed(2)}`, {
      x: columns[5].x + columns[5].width - 50,
      y: totalRowY - 15,
      size: this.fonts.tableHeader + 1,
      font: boldFont,
      color: this.colors.primary,
    });

    // Draw final column separators for total row
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

  private drawWorkPerformed(page: PDFPage, boldFont: PDFFont, regularFont: PDFFont, timeEntries: WorkOrderTimeEntry[], yPosition: number, width: number): number {
    // Section header
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

    // Combine all reports from time entries
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
      // Report header
      page.drawText(`${report.date} - ${report.technician}:`, {
        x: 40,
        y: yPosition,
        size: 10,
        font: boldFont,
        color: this.colors.text,
      });

      yPosition -= 15;

      // Report content in a box
      const reportLines = this.wrapText(report.report, 90);
      const boxHeight = reportLines.length * 12 + 10;
      
      page.drawRectangle({
        x: 40,
        y: yPosition - boxHeight,
        width: width - 80,
        height: boxHeight,
        borderColor: this.colors.darkGray,
        borderWidth: 1,
        color: rgb(0.99, 0.99, 0.99),
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

  private drawPartsSection(page: PDFPage, boldFont: PDFFont, regularFont: PDFFont, attachments: WorkOrderAttachment[], yPosition: number, width: number): number {
    // Section header
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

    // Parts ordered section
    page.drawText('Parts Ordered:', {
      x: 40,
      y: yPosition,
      size: 10,
      font: boldFont,
      color: this.colors.text,
    });

    yPosition -= 20;

    // Draw box for parts ordered (empty for manual entry)
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

    // Follow-up section
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

  private drawComments(page: PDFPage, boldFont: PDFFont, regularFont: PDFFont, comments: WorkOrderComment[], yPosition: number, width: number): number {
    // Section header
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

    // Show latest 3 comments
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

  private drawSignatureSection(page: PDFPage, boldFont: PDFFont, regularFont: PDFFont, workOrder: WorkOrder, yPosition: number, width: number): number {
    // Section header
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

    // Two-column layout for signatures
    const leftColumn = 40;
    const rightColumn = 320;
    const boxWidth = 250;
    const boxHeight = 50;

    // Client signature
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

    // Purchase Order
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

    // Printed name and date
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

  private drawFooter(page: PDFPage, regularFont: PDFFont, width: number, yPosition: number, pageNumber: number, totalPages: number): void {
    // Professional footer with subtle top border
    page.drawLine({
      start: { x: this.spacing.pageMargin, y: yPosition + 15 },
      end: { x: width - this.spacing.pageMargin, y: yPosition + 15 },
      thickness: 1,
      color: this.colors.border,
    });

    // Left side - Generation info
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

    // Center - Company branding
    const brandText = 'Work Order Management System';
    const brandWidth = brandText.length * (this.fonts.footer * 0.6); // Approximate width
    page.drawText(brandText, {
      x: (width - brandWidth) / 2,
      y: yPosition,
      size: this.fonts.footer,
      font: regularFont,
      color: this.colors.darkGray,
    });

    // Right side - Page numbers
    const pageText = `Page ${pageNumber} of ${totalPages}`;
    const pageWidth = pageText.length * (this.fonts.footer * 0.6); // Approximate width
    page.drawText(pageText, {
      x: width - this.spacing.pageMargin - pageWidth,
      y: yPosition,
      size: this.fonts.footer,
      font: regularFont,
      color: this.colors.darkGray,
    });
  }

  // Helper methods
  private getStatusColor(status: string): RGB {
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

  private formatTimeEntryType(type: string): string {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private wrapText(text: string, maxWidth: number): string[] {
    if (!text) return [''];
    
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

    return lines.length > 0 ? lines : [''];
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper method to estimate work performed section height
  private estimateWorkPerformedHeight(timeEntries: WorkOrderTimeEntry[]): number {
    const workReports = timeEntries.filter(entry => entry.report && entry.report.trim());
    if (workReports.length === 0) return 60; // Minimal height for "no reports" message
    
    let totalHeight = 50; // Section header
    workReports.forEach(report => {
      const reportLines = this.wrapText(report.report, 90);
      totalHeight += 25 + reportLines.length * 12 + 25; // Header + content + spacing
    });
    
    return totalHeight;
  }

  private drawPageContinuationHeader(page: PDFPage, boldFont: PDFFont, regularFont: PDFFont, workOrder: WorkOrder, yPosition: number, width: number): void {
    // Page continuation header
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
      color: rgb(1, 1, 1), // White text
    });

    page.drawText('Professional Work Order Report', {
      x: 45,
      y: yPosition - 50,
      size: 12,
      font: regularFont,
      color: rgb(0.9, 0.9, 0.9), // Light gray text
    });

    // Work Order title on the right
    const woTitle = 'WORK ORDER';
    const woTitleWidth = woTitle.length * 14; // Approximate width
    page.drawText(woTitle, {
      x: width - woTitleWidth - 45,
      y: yPosition - 35,
      size: 24,
      font: boldFont,
      color: this.colors.accent,
    });

    // Status indicator
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
      color: rgb(1, 1, 1),
    });
  }
} 