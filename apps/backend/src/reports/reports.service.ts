import { Injectable } from '@nestjs/common';
import { WorkOrdersService, DashboardStats } from '../work-orders/work-orders.service';
import { AssetsService } from '../assets/assets.service';
import { UsersService } from '../users/users.service';
import { PdfReportService } from './pdf-report.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly workOrdersService: WorkOrdersService,
    private readonly assetsService: AssetsService,
    private readonly usersService: UsersService,
    private readonly pdfReportService: PdfReportService,
  ) {}

  async generateWorkOrderPdf(workOrderId: string): Promise<Buffer> {
    const workOrder = await this.workOrdersService.findById(workOrderId);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    // Get related data
    const assignedTechnician = workOrder.assignedTo ? await this.usersService.findById(workOrder.assignedTo.id) : null;
    const asset = workOrder.asset ? await this.assetsService.findById(workOrder.asset.id) : null;
    
    // Get additional assigned users
    let additionalAssignees: any[] = [];
    if (workOrder.assignedUsers && workOrder.assignedUsers.length > 0) {
      try {
        const userPromises = workOrder.assignedUsers.map(userId => this.usersService.findById(userId));
        additionalAssignees = await Promise.all(userPromises);
        additionalAssignees = additionalAssignees.filter(user => user !== null);
      } catch (error) {
        console.error('Error fetching additional assignees:', error);
      }
    }

    return this.pdfReportService.generateWorkOrderCompletionReport(
      workOrder,
      assignedTechnician,
      null, // No requester since we removed that field
      asset,
      workOrder.comments,
      workOrder.attachments,
      additionalAssignees, // Pass additional assignees
    );
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

    // Get related data
    const assignedTechnician = workOrder.assignedTo ? await this.usersService.findById(workOrder.assignedTo.id) : null;
    const asset = workOrder.asset ? await this.assetsService.findById(workOrder.asset.id) : null;

    // Get additional assigned users
    let additionalAssignees: any[] = [];
    if (workOrder.assignedUsers && workOrder.assignedUsers.length > 0) {
      try {
        const userPromises = workOrder.assignedUsers.map(userId => this.usersService.findById(userId));
        additionalAssignees = await Promise.all(userPromises);
        additionalAssignees = additionalAssignees.filter(user => user !== null);
      } catch (error) {
        console.error('Error fetching additional assignees:', error);
      }
    }

    // Add completion notes to comments if provided
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
        } as any,
      ];
    }

    return this.pdfReportService.generateWorkOrderCompletionReport(
      workOrder,
      assignedTechnician,
      null, // No requester since we removed that field
      asset,
      comments,
      workOrder.attachments,
      additionalAssignees, // Pass additional assignees
    );
  }

  async generateMaintenanceScheduleReport(): Promise<Buffer> {
    const assets = await this.assetsService.findMaintenanceDue();
    
    // Create a simple maintenance schedule report
    const pdfDoc = await import('pdf-lib').then(lib => lib.PDFDocument.create());
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(await import('pdf-lib').then(lib => lib.StandardFonts.Helvetica));
    const boldFont = await pdfDoc.embedFont(await import('pdf-lib').then(lib => lib.StandardFonts.HelveticaBold));
    
    let yPosition = height - 50;
    
    // Title
    page.drawText('Asset Maintenance Schedule Report', {
      x: 50,
      y: yPosition,
      size: 20,
      font: boldFont,
    });
    
    yPosition -= 40;
    
    // Date
    page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
    });
    
    yPosition -= 30;
    
    // Assets table header
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
    
    // Assets
    for (const asset of assets) {
      if (yPosition < 100) {
        // Add new page if needed
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

  async generateDashboardSummaryReport(): Promise<Buffer> {
    const dashboardStats = await this.workOrdersService.getDashboardStats();
    const assets = await this.assetsService.findAll();
    const users = await this.usersService.findAll();
    
    // Create a dashboard summary report
    const pdfDoc = await import('pdf-lib').then(lib => lib.PDFDocument.create());
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(await import('pdf-lib').then(lib => lib.StandardFonts.Helvetica));
    const boldFont = await pdfDoc.embedFont(await import('pdf-lib').then(lib => lib.StandardFonts.HelveticaBold));
    
    let yPosition = height - 50;
    
    // Title
    page.drawText('Dashboard Summary Report', {
      x: 50,
      y: yPosition,
      size: 20,
      font: boldFont,
    });
    
    yPosition -= 40;
    
    // Date
    page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
    });
    
    yPosition -= 30;
    
    // Work Order Statistics
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
    
    // Asset Statistics
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
    
    // User Statistics
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
} 