import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, UseInterceptors, UploadedFile, Res, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { WorkOrdersService, ScheduleConflictWarning } from './work-orders.service';
import { TimeEntryService, CreateTimeEntryDto, UpdateTimeEntryDto } from './time-entry.service';
import { DevAuthGuard } from '../auth/guards/dev-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions/permissions.enum';
import { WorkOrder, WorkOrderStatus } from './entities/work-order.entity';
import { WorkOrderAttachment } from './entities/work-order-attachment.entity';
import { TimeEntryType } from './entities/work-order-time-entry.entity';
import * as path from 'path';
import * as fs from 'fs';

@ApiTags('Work Orders')
@Controller('work-orders')
@UseGuards(DevAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class WorkOrdersController {
  constructor(
    private readonly workOrdersService: WorkOrdersService,
    private readonly timeEntryService: TimeEntryService,
  ) {}

  @Get()
  @RequirePermissions(Permission.VIEW_WORK_ORDERS, Permission.VIEW_ALL_WORK_ORDERS)
  @ApiOperation({ summary: 'Get all work orders with advanced filtering' })
  @ApiResponse({ status: 200, description: 'Work orders retrieved successfully' })
  @ApiQuery({ name: 'status', required: false, enum: WorkOrderStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'assignedTo', required: false, type: String, description: 'Filter by assigned user ID' })
  @ApiQuery({ name: 'priority', required: false, type: String, description: 'Filter by priority' })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Filter by work order type' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Text search across title, description, and WO number' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'Filter by created date from (ISO string)' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'Filter by created date to (ISO string)' })
  @ApiQuery({ name: 'overdueOnly', required: false, type: Boolean, description: 'Show only overdue work orders' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limit number of results (default: 100)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset for pagination (default: 0)' })
  async findAll(
    @Request() req,
    @Query('status') status?: WorkOrderStatus,
    @Query('assignedTo') assignedTo?: string,
    @Query('priority') priority?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('tags') tags?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('overdueOnly') overdueOnly?: boolean,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<WorkOrder[]> {
    // If user only has VIEW_WORK_ORDERS (not VIEW_ALL_WORK_ORDERS), filter to their own work orders
    const user = req.user;
    const canViewAll = user.role === 'administrator' || user.role === 'manager';
    
    if (!canViewAll) {
      // For technicians and requesters, only show their assigned work orders
      assignedTo = user.id;
    }

    const tagArray = tags ? tags.split(',').map(tag => tag.trim()) : undefined;
    
    return this.workOrdersService.findAll({
      status,
      assignedTo,
      priority,
      type,
      search,
      tags: tagArray,
      dateFrom,
      dateTo,
      overdueOnly,
      limit: limit || 100,
      offset: offset || 0,
    });
  }

  @Get('tags')
  @RequirePermissions(Permission.VIEW_WORK_ORDERS, Permission.VIEW_ALL_WORK_ORDERS)
  @ApiOperation({ summary: 'Get all available tags' })
  @ApiResponse({ status: 200, description: 'Available tags retrieved successfully', type: [String] })
  async getAllTags(): Promise<string[]> {
    return this.workOrdersService.getAllTags();
  }

  // Time Entry Endpoints - MUST come before :id route to avoid route conflicts
  // Scheduling Integration Endpoints - MUST come before :id route to avoid route conflicts

  @Get('scheduled')
  @RequirePermissions(Permission.VIEW_WORK_ORDERS, Permission.VIEW_ALL_WORK_ORDERS)
  @ApiOperation({ summary: 'Get work orders by scheduled date range for calendar view' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'technicianId', required: false, description: 'Filter by technician ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'Scheduled work orders retrieved successfully' })
  async findScheduledWorkOrders(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('technicianId') technicianId?: string,
    @Query('status') status?: WorkOrderStatus
  ): Promise<WorkOrder[]> {
    try {
      // Validate required parameters
      if (!startDate || !endDate) {
        throw new Error('startDate and endDate are required parameters');
      }

      // Validate date format
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        throw new Error('Invalid date format. Please use YYYY-MM-DD format');
      }

      // Role-based filtering
      const user = req.user;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const canViewAll = user.role === 'administrator' || user.role === 'manager';
      
      if (!canViewAll && !technicianId) {
        // For technicians, only show their assigned work orders
        technicianId = user.id;
      }

      return this.workOrdersService.findScheduledWorkOrders({
        startDate,
        endDate,
        technicianId,
        status,
      });
    } catch (error) {
      console.error('Error in findScheduledWorkOrders:', error);
      throw error;
    }
  }

  @Get('active')
  @RequirePermissions(Permission.VIEW_WORK_ORDERS, Permission.VIEW_ALL_WORK_ORDERS)
  @ApiOperation({ summary: 'Get active work orders that can be assigned/scheduled' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by work order number, title, description, or customer name' })
  @ApiQuery({ name: 'status', required: false, enum: WorkOrderStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'priority', required: false, type: String, description: 'Filter by priority' })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Filter by work order type' })
  @ApiResponse({ status: 200, description: 'Active work orders retrieved successfully' })
  async findActiveWorkOrders(
    @Request() req,
    @Query('search') search?: string,
    @Query('status') status?: WorkOrderStatus,
    @Query('priority') priority?: string,
    @Query('type') type?: string
  ): Promise<WorkOrder[]> {
    return this.workOrdersService.findActiveWorkOrders({
      search,
      status,
      priority,
      type,
    });
  }

  @Get(':id/time-entries')
  @RequirePermissions(Permission.VIEW_WORK_ORDERS, Permission.VIEW_ALL_WORK_ORDERS)
  @ApiOperation({ summary: 'Get time entries for a work order' })
  @ApiResponse({ status: 200, description: 'Time entries retrieved successfully' })
  async getTimeEntries(@Param('id') workOrderId: string, @Request() req) {
    const workOrder = await this.workOrdersService.findById(workOrderId);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    // Check if user has permission to view this work order
    const user = req.user;
    const canViewAll = user.role === 'administrator' || user.role === 'manager';
    const isAssigned = workOrder.assignedTo?.id === user.id;

    if (!canViewAll && !isAssigned) {
      throw new Error('Access denied: You can only view time entries for work orders assigned to you');
    }

    return this.timeEntryService.getTimeEntriesByWorkOrder(workOrderId);
  }

  @Post(':id/time-entries')
  @RequirePermissions(Permission.UPDATE_WORK_ORDERS, Permission.UPDATE_OWN_WORK_ORDERS)
  @ApiOperation({ summary: 'Add time entry to work order' })
  @ApiResponse({ status: 201, description: 'Time entry added successfully' })
  async addTimeEntry(
    @Param('id') workOrderId: string,
    @Body() timeEntryData: Omit<CreateTimeEntryDto, 'workOrderId'>,
    @Request() req
  ) {
    const workOrder = await this.workOrdersService.findById(workOrderId);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    // Check if user has permission to add time entries to this work order
    const user = req.user;
    const canUpdateAll = user.role === 'administrator' || user.role === 'manager';
    const isAssigned = workOrder.assignedTo?.id === user.id;

    if (!canUpdateAll && !isAssigned) {
      throw new Error('Access denied: You can only add time entries to work orders assigned to you');
    }

    const createTimeEntryDto: CreateTimeEntryDto = {
      ...timeEntryData,
      workOrderId,
      technicianId: timeEntryData.technicianId || user.id, // Default to current user if not specified
    };

    return this.timeEntryService.createTimeEntry(createTimeEntryDto);
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_WORK_ORDERS, Permission.VIEW_ALL_WORK_ORDERS)
  @ApiOperation({ summary: 'Get work order by ID' })
  @ApiResponse({ status: 200, description: 'Work order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  async findOne(@Param('id') id: string, @Request() req): Promise<WorkOrder> {
    const workOrder = await this.workOrdersService.findById(id);
    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    // Check if user has permission to view this specific work order
    const user = req.user;
    const canViewAll = user.role === 'administrator' || user.role === 'manager';
    const isAssigned = workOrder.assignedTo?.id === user.id;

    if (!canViewAll && !isAssigned) {
      throw new Error('Access denied: You can only view work orders assigned to you');
    }

    return workOrder;
  }

  @Post()
  @RequirePermissions(Permission.CREATE_WORK_ORDERS)
  @ApiOperation({ summary: 'Create new work order' })
  @ApiResponse({ status: 201, description: 'Work order created successfully' })
  async create(@Body() createWorkOrderData: Partial<WorkOrder>, @Request() req): Promise<WorkOrder> {
    return this.workOrdersService.create(createWorkOrderData);
  }

  @Put(':id')
  @RequirePermissions(Permission.UPDATE_WORK_ORDERS, Permission.UPDATE_OWN_WORK_ORDERS)
  @ApiOperation({ summary: 'Update work order' })
  @ApiResponse({ status: 200, description: 'Work order updated successfully' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  async update(@Param('id') id: string, @Body() updateData: Partial<WorkOrder>, @Request() req): Promise<WorkOrder> {
    const workOrder = await this.workOrdersService.findById(id);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    // Check if user has permission to update this work order
    const user = req.user;
    const canUpdateAll = user.role === 'administrator' || user.role === 'manager';
    const isAssigned = workOrder.assignedTo?.id === user.id;

    if (!canUpdateAll && !isAssigned) {
      throw new Error('Access denied: You can only update work orders assigned to you');
    }

    return this.workOrdersService.update(id, updateData);
  }

  @Put(':id/status')
  @RequirePermissions(Permission.UPDATE_WORK_ORDERS, Permission.UPDATE_OWN_WORK_ORDERS)
  @ApiOperation({ summary: 'Update work order status' })
  @ApiResponse({ status: 200, description: 'Work order status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Body() statusData: { status: WorkOrderStatus; billingStatus?: 'not_ready' | 'in_progress' | 'ready' | 'completed'; completionNotes?: string },
    @Request() req
  ): Promise<WorkOrder> {
    const workOrder = await this.workOrdersService.findById(id);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    // Check if user has permission to update this work order status
    const user = req.user;
    const canUpdateAll = user.role === 'administrator' || user.role === 'manager';
    const isAssigned = workOrder.assignedTo?.id === user.id;

    if (!canUpdateAll && !isAssigned) {
      throw new Error('Access denied: You can only update status of work orders assigned to you');
    }

    return this.workOrdersService.updateStatus(id, statusData.status, statusData.completionNotes, statusData.billingStatus);
  }

  @Delete(':id')
  @RequirePermissions(Permission.DELETE_WORK_ORDERS)
  @ApiOperation({ summary: 'Delete work order' })
  @ApiResponse({ status: 200, description: 'Work order deleted successfully' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.workOrdersService.delete(id);
  }

  @Put('time-entries/:id')
  @RequirePermissions(Permission.UPDATE_WORK_ORDERS, Permission.UPDATE_OWN_WORK_ORDERS)
  @ApiOperation({ summary: 'Update time entry' })
  @ApiResponse({ status: 200, description: 'Time entry updated successfully' })
  async updateTimeEntry(
    @Param('id') timeEntryId: string,
    @Body() updateData: UpdateTimeEntryDto,
    @Request() req
  ) {
    const timeEntry = await this.timeEntryService.getTimeEntryById(timeEntryId);
    
    // Check if user has permission to update this time entry
    const user = req.user;
    const canUpdateAll = user.role === 'administrator' || user.role === 'manager';
    const isTechnician = timeEntry.technicianId === user.id;

    if (!canUpdateAll && !isTechnician) {
      throw new Error('Access denied: You can only update your own time entries');
    }

    return this.timeEntryService.updateTimeEntry(timeEntryId, updateData);
  }

  @Delete('time-entries/:id')
  @RequirePermissions(Permission.UPDATE_WORK_ORDERS, Permission.UPDATE_OWN_WORK_ORDERS)
  @ApiOperation({ summary: 'Delete time entry' })
  @ApiResponse({ status: 200, description: 'Time entry deleted successfully' })
  async deleteTimeEntry(@Param('id') timeEntryId: string, @Request() req) {
    const timeEntry = await this.timeEntryService.getTimeEntryById(timeEntryId);
    
    // Check if user has permission to delete this time entry
    const user = req.user;
    const canUpdateAll = user.role === 'administrator' || user.role === 'manager';
    const isTechnician = timeEntry.technicianId === user.id;

    if (!canUpdateAll && !isTechnician) {
      throw new Error('Access denied: You can only delete your own time entries');
    }

    return this.timeEntryService.deleteTimeEntry(timeEntryId);
  }

  @Get('stats/dashboard')
  @RequirePermissions(Permission.VIEW_WORK_ORDERS, Permission.VIEW_ALL_WORK_ORDERS)
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  async getDashboardStats(@Request() req) {
    const user = req.user;
    const canViewAll = user.role === 'administrator' || user.role === 'manager';
    
    if (canViewAll) {
      return this.workOrdersService.getDashboardStats();
    } else {
      // Return filtered stats for non-admin users
      return this.workOrdersService.getDashboardStatsForUser(user.id);
    }
  }

  @Get('overdue/list')
  @RequirePermissions(Permission.VIEW_WORK_ORDERS, Permission.VIEW_ALL_WORK_ORDERS)
  @ApiOperation({ summary: 'Get overdue work orders' })
  @ApiResponse({ status: 200, description: 'Overdue work orders retrieved successfully' })
  async getOverdueWorkOrders(@Request() req): Promise<WorkOrder[]> {
    const user = req.user;
    const canViewAll = user.role === 'administrator' || user.role === 'manager';
    
    if (canViewAll) {
      return this.workOrdersService.findOverdue();
    } else {
      // Return only overdue work orders assigned to the user
      return this.workOrdersService.findOverdueByUser(user.id);
    }
  }

  @Post(':id/comments')
  @RequirePermissions(Permission.CREATE_COMMENTS)
  @ApiOperation({ summary: 'Add comment to work order' })
  @ApiResponse({ status: 201, description: 'Comment added successfully' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  async addComment(
    @Param('id') id: string,
    @Body() commentData: { content: string; isInternal?: boolean },
    @Request() req
  ) {
    const workOrder = await this.workOrdersService.findById(id);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    // Check if user has permission to add comments to this work order
    const user = req.user;
    const canUpdateAll = user.role === 'administrator' || user.role === 'manager';
    const isAssigned = workOrder.assignedTo?.id === user.id;

    if (!canUpdateAll && !isAssigned) {
      throw new Error('Access denied: You can only add comments to work orders assigned to you');
    }

    return this.workOrdersService.addComment(
      id,
      commentData.content,
      user.id,
      commentData.isInternal || false
    );
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload attachment to work order' })
  @ApiResponse({ status: 201, description: 'Attachment uploaded successfully' })
  async uploadAttachment(
    @Param('id') workOrderId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { description?: string },
    @Request() req
  ): Promise<WorkOrderAttachment> {
    const workOrder = await this.workOrdersService.findById(workOrderId);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    // Check if user has permission to upload attachments to this work order
    const user = req.user;
    const canUpdateAll = user.role === 'administrator' || user.role === 'manager';
    const isAssigned = workOrder.assignedTo?.id === user.id;

    if (!canUpdateAll && !isAssigned) {
      throw new Error('Access denied: You can only upload attachments to work orders assigned to you');
    }

    if (!file) {
      throw new Error('No file uploaded');
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.originalname}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Save attachment record to database
    return this.workOrdersService.addAttachment(
      workOrderId,
      fileName,
      file.originalname,
      file.mimetype,
      file.size,
      filePath,
      user.id,
      body.description
    );
  }

  @Get('attachments/:id/download')
  @ApiOperation({ summary: 'Download attachment' })
  @ApiResponse({ status: 200, description: 'Attachment downloaded successfully' })
  async downloadAttachment(
    @Param('id') attachmentId: string,
    @Res() res: Response,
    @Request() req
  ) {
    const attachment = await this.workOrdersService.getAttachmentById(attachmentId);
    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // Check if user has permission to download this attachment
    const workOrder = await this.workOrdersService.findById(attachment.workOrderId);
    const user = req.user;
    const canViewAll = user.role === 'administrator' || user.role === 'manager';
    const isAssigned = workOrder.assignedTo?.id === user.id;

    if (!canViewAll && !isAssigned) {
      throw new Error('Access denied: You can only download attachments from work orders assigned to you');
    }

    const filePath = path.join(process.cwd(), 'uploads', attachment.fileName);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found on server');
    }

    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    
    return res.sendFile(filePath);
  }

  @Delete('attachments/:id')
  @RequirePermissions(Permission.DELETE_ANY_COMMENTS)
  @ApiOperation({ summary: 'Delete attachment' })
  @ApiResponse({ status: 200, description: 'Attachment deleted successfully' })
  async deleteAttachment(
    @Param('id') attachmentId: string,
    @Request() req
  ): Promise<void> {
    const attachment = await this.workOrdersService.getAttachmentById(attachmentId);
    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // Check if user has permission to delete this attachment
    const workOrder = await this.workOrdersService.findById(attachment.workOrderId);
    const user = req.user;
    const canDeleteAll = user.role === 'administrator' || user.role === 'manager';
    const isAssigned = workOrder.assignedTo?.id === user.id;

    if (!canDeleteAll && !isAssigned) {
      throw new Error('Access denied: You can only delete attachments from work orders assigned to you');
    }

    return this.workOrdersService.deleteAttachment(attachmentId);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed sample work orders (development only)' })
  @ApiResponse({ status: 201, description: 'Sample work orders created successfully' })
  async seedSampleWorkOrders() {
    return this.workOrdersService.seedSampleWorkOrders();
  }


  @Post(':id/assign')
  @RequirePermissions(Permission.UPDATE_WORK_ORDERS)
  @ApiOperation({ summary: 'Assign work order to technician with automatic hour calculation' })
  @ApiResponse({ status: 200, description: 'Work order assigned successfully', schema: {
    type: 'object',
    properties: {
      workOrder: { type: 'object' },
      warnings: { 
        type: 'array',
        items: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            severity: { type: 'string', enum: ['warning', 'error'] },
            technicianName: { type: 'string' },
            date: { type: 'string' },
            currentUtilization: { type: 'number' },
            newUtilization: { type: 'number' },
            scheduledHours: { type: 'number' },
            availableHours: { type: 'number' },
          }
        }
      }
    }
  }})
  @ApiResponse({ status: 404, description: 'Work order not found' })
  async assignWorkOrder(
    @Param('id') workOrderId: string,
    @Body() assignmentData: {
      assignedToId: string;
      scheduledStartDate?: string;
      estimatedHours?: number;
    },
    @Request() req
  ): Promise<{ workOrder: WorkOrder; warnings: ScheduleConflictWarning[] }> {
    try {
      const { assignedToId, scheduledStartDate, estimatedHours } = assignmentData;
      
      const scheduledDate = scheduledStartDate ? new Date(scheduledStartDate) : undefined;
      
      return await this.workOrdersService.assignWorkOrder(
        workOrderId,
        assignedToId,
        scheduledDate,
        estimatedHours
      );
    } catch (error) {
      if (error.message?.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Post(':id/check-conflicts')
  @RequirePermissions(Permission.VIEW_WORK_ORDERS)
  @ApiOperation({ summary: 'Check for schedule conflicts before assigning work order' })
  @ApiResponse({ status: 200, description: 'Conflict check completed', type: [Object] })
  async checkScheduleConflicts(
    @Param('id') workOrderId: string,
    @Body() assignmentData: {
      assignedToId: string;
      scheduledStartDate?: string;
      estimatedHours?: number;
    },
    @Request() req
  ): Promise<ScheduleConflictWarning[]> {
    const workOrder = await this.workOrdersService.findById(workOrderId);
    if (!workOrder) {
      throw new Error('Work order not found');
    }

    // Create a temporary work order object with the proposed assignment
    const tempWorkOrder = {
      ...workOrder,
      assignedToId: assignmentData.assignedToId,
      scheduledStartDate: assignmentData.scheduledStartDate ? new Date(assignmentData.scheduledStartDate) : workOrder.scheduledStartDate,
      estimatedHours: assignmentData.estimatedHours ?? workOrder.estimatedHours,
    } as WorkOrder;

    return this.workOrdersService.checkScheduleConflicts(tempWorkOrder);
  }
} 