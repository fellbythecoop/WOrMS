import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WorkOrdersService } from './work-orders.service';
import { DevAuthGuard } from '../auth/guards/dev-auth.guard';
import { WorkOrder, WorkOrderStatus } from './entities/work-order.entity';

@ApiTags('Work Orders')
@Controller('work-orders')
@UseGuards(DevAuthGuard)
@ApiBearerAuth()
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get()
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
    @Query('status') status?: WorkOrderStatus,
    @Query('assignedTo') assignedTo?: string,
    @Query('priority') priority?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('overdueOnly') overdueOnly?: boolean,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<WorkOrder[]> {
    return this.workOrdersService.findAll({ 
      status, 
      assignedTo, 
      priority, 
      type, 
      search, 
      dateFrom, 
      dateTo, 
      overdueOnly,
      limit: limit || 100,
      offset: offset || 0
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get work order by ID' })
  @ApiResponse({ status: 200, description: 'Work order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  async findOne(@Param('id') id: string): Promise<WorkOrder> {
    const workOrder = await this.workOrdersService.findById(id);
    if (!workOrder) {
      throw new Error('Work order not found');
    }
    return workOrder;
  }

  @Post()
  @ApiOperation({ summary: 'Create new work order' })
  @ApiResponse({ status: 201, description: 'Work order created successfully' })
  async create(@Body() createWorkOrderData: Partial<WorkOrder>): Promise<WorkOrder> {
    return this.workOrdersService.create(createWorkOrderData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update work order' })
  @ApiResponse({ status: 200, description: 'Work order updated successfully' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  async update(@Param('id') id: string, @Body() updateData: Partial<WorkOrder>): Promise<WorkOrder> {
    return this.workOrdersService.update(id, updateData);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update work order status' })
  @ApiResponse({ status: 200, description: 'Work order status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Body() statusData: { status: WorkOrderStatus; completionNotes?: string }
  ): Promise<WorkOrder> {
    return this.workOrdersService.updateStatus(id, statusData.status, statusData.completionNotes);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete work order' })
  @ApiResponse({ status: 200, description: 'Work order deleted successfully' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.workOrdersService.delete(id);
  }

  @Get('stats/dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  async getDashboardStats() {
    return this.workOrdersService.getDashboardStats();
  }

  @Get('overdue/list')
  @ApiOperation({ summary: 'Get overdue work orders' })
  @ApiResponse({ status: 200, description: 'Overdue work orders retrieved successfully' })
  async getOverdueWorkOrders(): Promise<WorkOrder[]> {
    return this.workOrdersService.findOverdue();
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add comment to work order' })
  @ApiResponse({ status: 201, description: 'Comment added successfully' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  async addComment(
    @Param('id') id: string,
    @Body() commentData: { content: string; isInternal?: boolean; authorId: string }
  ) {
    return this.workOrdersService.addComment(
      id,
      commentData.content,
      commentData.authorId,
      commentData.isInternal || false
    );
  }

  @Post('seed/sample-data')
  @ApiOperation({ summary: 'Seed sample work orders for development' })
  @ApiResponse({ status: 201, description: 'Sample work orders created successfully' })
  async seedSampleWorkOrders() {
    return this.workOrdersService.seedSampleWorkOrders();
  }
} 