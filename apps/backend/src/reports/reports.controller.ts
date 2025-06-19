import { Controller, Get, Post, Param, Body, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { DevAuthGuard } from '../auth/guards/dev-auth.guard';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(DevAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('work-order/:id/pdf')
  @ApiOperation({ summary: 'Generate work order PDF report' })
  @ApiResponse({ status: 200, description: 'PDF generated successfully' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  async generateWorkOrderPdf(
    @Param('id') workOrderId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.reportsService.generateWorkOrderPdf(workOrderId);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="work-order-${workOrderId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    
    res.send(pdfBuffer);
  }

  @Post('work-order/:id/complete')
  @ApiOperation({ summary: 'Generate completion report with signature' })
  @ApiResponse({ status: 200, description: 'Completion report generated successfully' })
  async generateCompletionReport(
    @Param('id') workOrderId: string,
    @Body() data: { signature: string; completionNotes?: string },
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.reportsService.generateCompletionReport(
      workOrderId,
      data.signature,
      data.completionNotes,
    );
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="completion-report-${workOrderId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    
    res.send(pdfBuffer);
  }

  @Get('assets/maintenance-schedule')
  @ApiOperation({ summary: 'Generate asset maintenance schedule report' })
  @ApiResponse({ status: 200, description: 'Maintenance schedule report generated successfully' })
  async generateMaintenanceScheduleReport(@Res() res: Response) {
    const pdfBuffer = await this.reportsService.generateMaintenanceScheduleReport();
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="maintenance-schedule.pdf"',
      'Content-Length': pdfBuffer.length,
    });
    
    res.send(pdfBuffer);
  }

  @Get('dashboard/summary')
  @ApiOperation({ summary: 'Generate dashboard summary report' })
  @ApiResponse({ status: 200, description: 'Dashboard summary report generated successfully' })
  async generateDashboardSummaryReport(@Res() res: Response) {
    const pdfBuffer = await this.reportsService.generateDashboardSummaryReport();
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="dashboard-summary.pdf"',
      'Content-Length': pdfBuffer.length,
    });
    
    res.send(pdfBuffer);
  }
} 