import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SchedulingService } from './scheduling.service';
import { CreateScheduleDto, UpdateScheduleDto, ScheduleQueryDto, ScheduleResponseDto, UtilizationStatsDto } from './dto/schedule.dto';
import { DevAuthGuard } from '../auth/guards/dev-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions/permissions.enum';

@ApiTags('Scheduling')
@Controller('scheduling')
@UseGuards(DevAuthGuard, PermissionsGuard)
export class SchedulingController {
  private readonly logger = new Logger(SchedulingController.name);

  constructor(private readonly schedulingService: SchedulingService) {}

  @Post()
  @RequirePermissions(Permission.MANAGE_SCHEDULES)
  @ApiOperation({ summary: 'Create a new technician schedule' })
  @ApiResponse({ status: 201, description: 'Schedule created successfully', type: ScheduleResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Schedule already exists for this technician on this date' })
  async create(@Body() createScheduleDto: CreateScheduleDto) {
    this.logger.log(`Creating schedule for technician ${createScheduleDto.technicianId} on ${createScheduleDto.date}`);
    return await this.schedulingService.create(createScheduleDto);
  }

  @Get()
  @RequirePermissions(Permission.VIEW_SCHEDULES)
  @ApiOperation({ summary: 'Get all schedules with optional filtering' })
  @ApiQuery({ name: 'technicianId', required: false, description: 'Filter by technician ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter from date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter to date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'isAvailable', required: false, description: 'Filter by availability' })
  @ApiQuery({ name: 'utilizationStatus', required: false, enum: ['under', 'optimal', 'over'], description: 'Filter by utilization status' })
  @ApiResponse({ status: 200, description: 'Schedules retrieved successfully', type: [ScheduleResponseDto] })
  async findAll(@Query() query: ScheduleQueryDto) {
    this.logger.log(`Fetching schedules with query: ${JSON.stringify(query)}`);
    return await this.schedulingService.findAll(query);
  }

  @Get('utilization/stats')
  @RequirePermissions(Permission.VIEW_WORK_ORDERS)
  @ApiOperation({ summary: 'Get utilization statistics' })
  @ApiQuery({ name: 'technicianId', required: false, description: 'Filter by technician ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Utilization statistics retrieved successfully', type: UtilizationStatsDto })
  async getUtilizationStats(
    @Query('technicianId') technicianId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<UtilizationStatsDto> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return this.schedulingService.getUtilizationStats(technicianId, start, end);
  }

  @Get('technician/:technicianId')
  @RequirePermissions(Permission.VIEW_SCHEDULES)
  @ApiOperation({ summary: 'Get schedules for a specific technician within a date range' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Technician schedules retrieved successfully', type: [ScheduleResponseDto] })
  async findByTechnicianAndDateRange(
    @Param('technicianId') technicianId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    this.logger.log(`Fetching schedules for technician ${technicianId} from ${startDate} to ${endDate}`);
    
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    return await this.schedulingService.findByTechnicianAndDateRange(technicianId, startDateObj, endDateObj);
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_SCHEDULES)
  @ApiOperation({ summary: 'Get a specific schedule by ID' })
  @ApiResponse({ status: 200, description: 'Schedule retrieved successfully', type: ScheduleResponseDto })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async findOne(@Param('id') id: string) {
    this.logger.log(`Fetching schedule ${id}`);
    return await this.schedulingService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.MANAGE_SCHEDULES)
  @ApiOperation({ summary: 'Update a schedule' })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully', type: ScheduleResponseDto })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  @ApiResponse({ status: 409, description: 'Schedule conflict detected' })
  async update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto) {
    this.logger.log(`Updating schedule ${id}`);
    return await this.schedulingService.update(id, updateScheduleDto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.MANAGE_SCHEDULES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a schedule' })
  @ApiResponse({ status: 204, description: 'Schedule deleted successfully' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async remove(@Param('id') id: string) {
    this.logger.log(`Deleting schedule ${id}`);
    await this.schedulingService.remove(id);
  }

  @Patch(':id/scheduled-hours')
  @RequirePermissions(Permission.MANAGE_SCHEDULES)
  @ApiOperation({ summary: 'Set scheduled hours for a schedule' })
  @ApiResponse({ status: 200, description: 'Scheduled hours set successfully', type: ScheduleResponseDto })
  async setScheduledHours(
    @Param('id') id: string,
    @Body() body: { totalHours: number },
  ) {
    this.logger.log(`Setting scheduled hours for schedule ${id}: ${body.totalHours} hours`);
    
    const schedule = await this.schedulingService.findOne(id);
    return await this.schedulingService.setScheduledHours(
      schedule.technicianId,
      schedule.date,
      body.totalHours,
    );
  }

  @Post('technician/:technicianId/scheduled-hours')
  @RequirePermissions(Permission.MANAGE_SCHEDULES)
  @ApiOperation({ summary: 'Set scheduled hours for a technician on a specific date' })
  @ApiResponse({ status: 200, description: 'Scheduled hours set successfully', type: ScheduleResponseDto })
  async setTechnicianScheduledHours(
    @Param('technicianId') technicianId: string,
    @Body() body: { date: string; totalHours: number },
  ) {
    this.logger.log(`Setting scheduled hours for technician ${technicianId} on ${body.date}: ${body.totalHours} hours`);
    
    const date = new Date(body.date);
    return await this.schedulingService.setScheduledHours(technicianId, date, body.totalHours);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed sample schedules (development only)' })
  @ApiResponse({ status: 201, description: 'Sample schedules created successfully' })
  async seedSampleSchedules() {
    return this.schedulingService.seedSampleSchedules();
  }
} 