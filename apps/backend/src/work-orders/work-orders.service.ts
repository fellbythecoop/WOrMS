import { Injectable, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkOrder, WorkOrderStatus, WorkOrderPriority, WorkOrderType } from './entities/work-order.entity';
import { WorkOrderComment } from './entities/work-order-comment.entity';
import { WorkOrderAttachment } from './entities/work-order-attachment.entity';
import { User } from '../users/entities/user.entity';
import { CacheService } from '../cache/cache.service';
import { SchedulingService } from '../scheduling/scheduling.service';
import { WorkOrdersGateway } from '../websocket/work-orders.gateway';
import { Not, IsNull } from 'typeorm';
import * as fs from 'fs';

export interface DashboardStats {
  open: number;
  inProgress: number;
  completed: number;
  overdue: number;
  completedToday: number;
}

export interface ScheduleConflictWarning {
  message: string;
  severity: 'warning' | 'error';
  technicianName: string;
  date: string;
  currentUtilization: number;
  newUtilization: number;
  scheduledHours: number;
  availableHours: number;
}

@Injectable()
export class WorkOrdersService {
  private readonly logger = new Logger(WorkOrdersService.name);
  private readonly recalculationLocks = new Map<string, Promise<void>>();

  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(WorkOrderComment)
    private readonly commentRepository: Repository<WorkOrderComment>,
    @InjectRepository(WorkOrderAttachment)
    private readonly attachmentRepository: Repository<WorkOrderAttachment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cacheService: CacheService,
    private readonly schedulingService: SchedulingService,
    @Inject(forwardRef(() => WorkOrdersGateway))
    private readonly workOrdersGateway: WorkOrdersGateway,
  ) {}

  async findAll(filters?: {
    status?: WorkOrderStatus;
    assignedTo?: string;
    priority?: string;
    type?: string;
    search?: string;
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
    overdueOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<WorkOrder[]> {
    const query = this.workOrderRepository
      .createQueryBuilder('workOrder')
      .leftJoinAndSelect('workOrder.assignedTo', 'assignedTo')
      .leftJoinAndSelect('workOrder.asset', 'asset')
      .leftJoinAndSelect('workOrder.customer', 'customer');

    // Status filter
    if (filters?.status) {
      query.andWhere('workOrder.status = :status', { status: filters.status });
    }

    // Assigned to filter
    if (filters?.assignedTo) {
      query.andWhere('workOrder.assignedToId = :assignedTo', { assignedTo: filters.assignedTo });
    }

    // Priority filter
    if (filters?.priority) {
      query.andWhere('workOrder.priority = :priority', { priority: filters.priority });
    }

    // Type filter
    if (filters?.type) {
      query.andWhere('workOrder.type = :type', { type: filters.type });
    }

    // Text search across multiple fields
    if (filters?.search) {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      query.andWhere(
        `(LOWER(workOrder.title) LIKE :search 
         OR LOWER(workOrder.description) LIKE :search 
         OR LOWER(workOrder.workOrderNumber) LIKE :search
         OR LOWER(CONCAT(assignedTo.firstName, ' ', assignedTo.lastName)) LIKE :search)`,
        { search: searchTerm }
      );
    }

    // Tag search
    if (filters?.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map((tag, index) => 
        `workOrder.tags LIKE :tag${index}`
      );
      const tagParams = filters.tags.reduce((params, tag, index) => {
        params[`tag${index}`] = `%"${tag}"%`;
        return params;
      }, {} as Record<string, string>);
      
      query.andWhere(`(${tagConditions.join(' OR ')})`, tagParams);
    }

    // Date range filters
    if (filters?.dateFrom) {
      query.andWhere('workOrder.createdAt >= :dateFrom', { dateFrom: new Date(filters.dateFrom) });
    }

    if (filters?.dateTo) {
      // Add end of day to include the full day
      const endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      query.andWhere('workOrder.createdAt <= :dateTo', { dateTo: endDate });
    }

    // Overdue only filter
    if (filters?.overdueOnly) {
      const today = new Date();
      query.andWhere('workOrder.scheduledEndDate < :today', { today })
           .andWhere('workOrder.status NOT IN (:...completedStatuses)', {
             completedStatuses: [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED, WorkOrderStatus.CLOSED],
           });
    }

    // Pagination
    if (filters?.limit) {
      query.limit(filters.limit);
    }

    if (filters?.offset) {
      query.offset(filters.offset);
    }

    // Default ordering by creation date (newest first)
    query.orderBy('workOrder.createdAt', 'DESC');

    return query.getMany();
  }

  async findById(id: string): Promise<WorkOrder | null> {
    // Use QueryBuilder for better performance with selective loading
    return this.workOrderRepository
      .createQueryBuilder('workOrder')
      .leftJoinAndSelect('workOrder.assignedTo', 'assignedTo')
      .leftJoinAndSelect('workOrder.asset', 'asset')
      .leftJoinAndSelect('workOrder.customer', 'customer')
      .leftJoinAndSelect('workOrder.comments', 'comments')
      .leftJoinAndSelect('comments.author', 'commentAuthor')
      .leftJoinAndSelect('workOrder.attachments', 'attachments')
      .leftJoinAndSelect('workOrder.timeEntries', 'timeEntries')
      .leftJoinAndSelect('timeEntries.technician', 'technician')
      .where('workOrder.id = :id', { id })
      .orderBy('comments.createdAt', 'ASC')
      .addOrderBy('attachments.createdAt', 'ASC')
      .addOrderBy('timeEntries.createdAt', 'ASC')
      .getOne();
  }

  async create(workOrderData: Partial<WorkOrder>): Promise<WorkOrder> {
    // Generate work order number if not provided
    if (!workOrderData.workOrderNumber) {
      workOrderData.workOrderNumber = await this.generateWorkOrderNumber();
    }

    const workOrder = this.workOrderRepository.create(workOrderData);
    const savedWorkOrder = await this.workOrderRepository.save(workOrder);
    
    // Note: Schedule calculation is now handled in the assignWorkOrder method
    
    // Invalidate related caches
    await this.cacheService.invalidateWorkOrderCaches();
    
    return savedWorkOrder;
  }

  async update(id: string, updateData: Partial<WorkOrder>): Promise<WorkOrder> {
    // Remove relations that can't be updated directly
    const { comments, attachments, timeEntries, assignedTo, asset, customer, assignedUsers, workOrderTags, ...updateFields } = updateData;
    
    // Get the existing work order to update special fields
    const existingWorkOrder = await this.findById(id);
    if (!existingWorkOrder) {
      throw new Error('Work order not found');
    }

    // Track scheduling changes
    const schedulingChanged = (
      updateFields.assignedToId !== existingWorkOrder.assignedToId ||
      updateFields.scheduledStartDate !== existingWorkOrder.scheduledStartDate ||
      updateFields.estimatedHours !== existingWorkOrder.estimatedHours
    );

    // Note: Schedule recalculation is now handled explicitly in assignWorkOrder method

    // Handle assignedUsers and workOrderTags specially using setters
    if (assignedUsers !== undefined) {
      existingWorkOrder.assignedUsers = assignedUsers;
    }
    
    if (workOrderTags !== undefined) {
      existingWorkOrder.workOrderTags = workOrderTags;
    }

    // Update other fields
    Object.assign(existingWorkOrder, updateFields);
    
    // Save the updated work order
    const updatedWorkOrder = await this.workOrderRepository.save(existingWorkOrder);
    
    // Note: Schedule recalculation is now handled explicitly in assignWorkOrder method
    
    // Invalidate related caches
    await this.cacheService.invalidateWorkOrderCaches();
    
    return updatedWorkOrder;
  }

  async updateStatus(
    id: string,
    status: WorkOrderStatus,
    completionNotes?: string,
    billingStatus?: 'not_ready' | 'in_progress' | 'ready' | 'completed',
  ): Promise<WorkOrder> {
    const updateData: Partial<WorkOrder> = { status };

    // Set completion date when marking as completed
    if (status === WorkOrderStatus.COMPLETED) {
      updateData.actualEndDate = new Date();
      if (completionNotes) {
        updateData.completionNotes = completionNotes;
      }
    }

    // Set start date when marking as in progress
    if (status === WorkOrderStatus.IN_PROGRESS) {
      updateData.actualStartDate = new Date();
    }

    // Update billing status if provided
    if (billingStatus) {
      updateData.billingStatus = billingStatus;
    }

    return this.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    const result = await this.workOrderRepository.delete(id);
    if (result.affected === 0) {
      throw new Error('Work order not found');
    }
    
    // Invalidate related caches
    await this.cacheService.invalidateWorkOrderCaches();
  }

  async findOverdue(): Promise<WorkOrder[]> {
    const today = new Date();
    return this.workOrderRepository
      .createQueryBuilder('workOrder')
      .leftJoinAndSelect('workOrder.assignedTo', 'assignedTo')
      .leftJoinAndSelect('workOrder.asset', 'asset')
      .where('workOrder.scheduledEndDate < :today', { today })
      .andWhere('workOrder.status NOT IN (:...completedStatuses)', {
        completedStatuses: [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED, WorkOrderStatus.CLOSED],
      })
      .orderBy('workOrder.scheduledEndDate', 'ASC')
      .getMany();
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const cacheKey = 'dashboard_stats';
    const cached = await this.cacheService.get<DashboardStats>(cacheKey);
    if (cached) {
      return cached;
    }

    // Optimized single query for all dashboard stats
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const result = await this.workOrderRepository
      .createQueryBuilder('workOrder')
      .select([
        `SUM(CASE WHEN workOrder.status = '${WorkOrderStatus.OPEN}' THEN 1 ELSE 0 END) as open`,
        `SUM(CASE WHEN workOrder.status = '${WorkOrderStatus.IN_PROGRESS}' THEN 1 ELSE 0 END) as inProgress`,
        `SUM(CASE WHEN workOrder.status = '${WorkOrderStatus.COMPLETED}' THEN 1 ELSE 0 END) as completed`,
        `SUM(CASE WHEN workOrder.scheduledEndDate < :today AND workOrder.status NOT IN ('${WorkOrderStatus.COMPLETED}', '${WorkOrderStatus.CANCELLED}', '${WorkOrderStatus.CLOSED}') THEN 1 ELSE 0 END) as overdue`,
        `SUM(CASE WHEN workOrder.status = '${WorkOrderStatus.COMPLETED}' AND workOrder.actualEndDate >= :startOfDay AND workOrder.actualEndDate <= :endOfDay THEN 1 ELSE 0 END) as completedToday`,
      ])
      .setParameters({ today, startOfDay, endOfDay })
      .getRawOne();

    const stats: DashboardStats = {
      open: parseInt(result.open) || 0,
      inProgress: parseInt(result.inProgress) || 0,
      completed: parseInt(result.completed) || 0,
      overdue: parseInt(result.overdue) || 0,
      completedToday: parseInt(result.completedToday) || 0,
    };

    await this.cacheService.set(cacheKey, stats, 120); // Cache for 2 minutes
    return stats;
  }

  async getDashboardStatsForUser(userId: string): Promise<DashboardStats> {
    const cacheKey = `dashboard_stats_user_${userId}`;
    const cached = await this.cacheService.get<DashboardStats>(cacheKey);
    if (cached) {
      return cached;
    }

    const [
      open,
      inProgress,
      completed,
      overdue,
      completedToday,
    ] = await Promise.all([
      this.workOrderRepository.count({ 
        where: { 
          status: WorkOrderStatus.OPEN,
          assignedToId: userId 
        } 
      }),
      this.workOrderRepository.count({ 
        where: { 
          status: WorkOrderStatus.IN_PROGRESS,
          assignedToId: userId 
        } 
      }),
      this.workOrderRepository.count({ 
        where: { 
          status: WorkOrderStatus.COMPLETED,
          assignedToId: userId 
        } 
      }),
      this.workOrderRepository.count({
        where: {
          scheduledEndDate: new Date(),
          status: WorkOrderStatus.OPEN,
          assignedToId: userId,
        },
      }),
      this.workOrderRepository.count({
        where: {
          status: WorkOrderStatus.COMPLETED,
          actualEndDate: new Date(),
          assignedToId: userId,
        },
      }),
    ]);

    const stats: DashboardStats = {
      open,
      inProgress,
      completed,
      overdue,
      completedToday,
    };

    await this.cacheService.set(cacheKey, stats, 120); // Cache for 2 minutes
    return stats;
  }

  async findOverdueByUser(userId: string): Promise<WorkOrder[]> {
    const today = new Date();
    return this.workOrderRepository
      .createQueryBuilder('workOrder')
      .leftJoinAndSelect('workOrder.assignedTo', 'assignedTo')
      .leftJoinAndSelect('workOrder.asset', 'asset')
      .where('workOrder.scheduledEndDate < :today', { today })
      .andWhere('workOrder.status NOT IN (:...completedStatuses)', {
        completedStatuses: [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED, WorkOrderStatus.CLOSED],
      })
      .andWhere('workOrder.assignedToId = :userId', { userId })
      .orderBy('workOrder.scheduledEndDate', 'ASC')
      .getMany();
  }

  /**
   * Find work orders by scheduled date range for calendar view
   */
  async findScheduledWorkOrders(filters: {
    startDate: string;
    endDate: string;
    technicianId?: string;
    status?: WorkOrderStatus;
  }): Promise<WorkOrder[]> {
    try {
      this.logger.log(`Finding scheduled work orders with filters: ${JSON.stringify(filters)}`);
      
      // Validate and parse dates
      if (!filters.startDate || !filters.endDate) {
        throw new Error('Start date and end date are required');
      }

      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      
      // Validate parsed dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date format provided');
      }

      endDate.setHours(23, 59, 59, 999); // End of day

      this.logger.log(`Parsed dates - Start: ${startDate.toISOString()}, End: ${endDate.toISOString()}`);

      // Build the query with better error handling
      const queryBuilder = this.workOrderRepository
        .createQueryBuilder('workOrder');

      // Add joins with error handling
      try {
        queryBuilder
          .leftJoinAndSelect('workOrder.assignedTo', 'assignedTo')
          .leftJoinAndSelect('workOrder.asset', 'asset')
          .leftJoinAndSelect('workOrder.customer', 'customer');
      } catch (joinError) {
        this.logger.warn('Warning: Some relations may not be available', joinError.message);
        // Continue without relations if there's an issue
      }

      // Apply filters
      queryBuilder
        .where('workOrder.scheduledStartDate IS NOT NULL')
        .andWhere('workOrder.scheduledStartDate BETWEEN :startDate AND :endDate', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

      if (filters.technicianId) {
        queryBuilder.andWhere('workOrder.assignedToId = :technicianId', {
          technicianId: filters.technicianId,
        });
      }

      if (filters.status) {
        queryBuilder.andWhere('workOrder.status = :status', { status: filters.status });
      }

      const result = await queryBuilder
        .orderBy('workOrder.scheduledStartDate', 'ASC')
        .addOrderBy('workOrder.priority', 'DESC')
        .getMany();

      this.logger.log(`Found ${result.length} scheduled work orders`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to find scheduled work orders: ${error.message}`, error.stack);
      throw new Error(`Failed to fetch scheduled work orders: ${error.message}`);
    }
  }

  /**
   * Find active work orders that can be assigned/scheduled
   */
  async findActiveWorkOrders(filters?: {
    search?: string;
    status?: WorkOrderStatus;
    priority?: string;
    type?: string;
  }): Promise<WorkOrder[]> {
    const query = this.workOrderRepository.createQueryBuilder('workOrder')
      .leftJoinAndSelect('workOrder.assignedTo', 'assignedTo')
      .leftJoinAndSelect('workOrder.asset', 'asset')
      .leftJoinAndSelect('workOrder.customer', 'customer')
      .where('workOrder.status IN (:...activeStatuses)', { 
        activeStatuses: ['open', 'in_progress', 'pending', 'assigned'] 
      });

    if (filters?.search) {
      query.andWhere(
        '(workOrder.workOrderNumber ILIKE :search OR workOrder.title ILIKE :search OR workOrder.description ILIKE :search OR customer.name ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters?.status) {
      query.andWhere('workOrder.status = :status', { status: filters.status });
    }

    if (filters?.priority) {
      query.andWhere('workOrder.priority = :priority', { priority: filters.priority });
    }

    if (filters?.type) {
      query.andWhere('workOrder.type = :type', { type: filters.type });
    }

    return query
      .orderBy('workOrder.priority', 'DESC')
      .addOrderBy('workOrder.createdAt', 'DESC')
      .getMany();
  }

  async addComment(workOrderId: string, content: string, authorId: string, isInternal = false): Promise<WorkOrderComment> {
    const comment = this.commentRepository.create({
      workOrderId,
      content,
      authorId,
      isInternal,
    });

    return this.commentRepository.save(comment);
  }

  async addAttachment(
    workOrderId: string,
    fileName: string,
    originalName: string,
    mimeType: string,
    fileSize: number,
    filePath: string,
    uploadedById: string,
    description?: string,
  ): Promise<WorkOrderAttachment> {
    const attachment = this.attachmentRepository.create({
      workOrderId,
      fileName,
      originalName,
      mimeType,
      fileSize,
      filePath,
      uploadedById,
      description,
    });

    return this.attachmentRepository.save(attachment);
  }

  async getAttachmentById(attachmentId: string): Promise<WorkOrderAttachment | null> {
    return this.attachmentRepository.findOne({
      where: { id: attachmentId },
      relations: ['uploadedBy'],
    });
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    const attachment = await this.getAttachmentById(attachmentId);
    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // Delete file from filesystem
    try {
      await fs.promises.unlink(attachment.filePath);
    } catch (error) {
      console.warn('Failed to delete attachment file:', error);
    }

    // Delete from database
    await this.attachmentRepository.delete(attachmentId);
  }

  async getAllTags(): Promise<string[]> {
    const workOrders = await this.workOrderRepository.find({
      where: { tags: Not(IsNull()) }
    });

    const tagSet = new Set<string>();
    
    workOrders.forEach(workOrder => {
      if (workOrder.tags) {
        try {
          const tags = JSON.parse(workOrder.tags);
          if (Array.isArray(tags)) {
            tags.forEach(tag => {
              if (tag && typeof tag === 'string' && tag.trim()) {
                tagSet.add(tag.trim());
              }
            });
          }
        } catch (error) {
          // Ignore invalid JSON
        }
      }
    });

    return Array.from(tagSet).sort();
  }

  async seedSampleWorkOrders(): Promise<WorkOrder[]> {
    // Check if work orders already exist
    const existingWorkOrders = await this.workOrderRepository.count();
    if (existingWorkOrders > 0) {
      return this.findAll();
    }

    // Get users for sample data (ensure users are seeded first)
    const users = await this.workOrderRepository.manager.find('User');
    if (users.length === 0) {
      throw new Error('Please seed users first by calling POST /api/users/seed');
    }

    const sampleWorkOrders = [
      {
        title: 'Fix broken air conditioning unit',
        description: 'The AC unit in conference room B is not cooling properly. Temperature sensors show it\'s running 10+ degrees warmer than set point.',
        status: WorkOrderStatus.OPEN,
        priority: WorkOrderPriority.HIGH,
        type: WorkOrderType.REPAIR,
        estimatedHours: 4,
        estimatedCost: 250,
        requestedById: users.find(u => u.role === 'REQUESTER')?.id || users[0].id,
        scheduledStartDate: new Date('2024-12-15T08:00:00Z'),
        scheduledEndDate: new Date('2024-12-15T12:00:00Z'),
      },
      {
        title: 'Replace fluorescent lights with LED',
        description: 'Replace old fluorescent light fixtures with energy-efficient LED fixtures in the main office area.',
        status: WorkOrderStatus.IN_PROGRESS,
        priority: WorkOrderPriority.MEDIUM,
        type: WorkOrderType.MAINTENANCE,
        estimatedHours: 6,
        actualHours: 3,
        estimatedCost: 400,
        actualCost: 350,
        requestedById: users.find(u => u.role === 'REQUESTER')?.id || users[0].id,
        assignedToId: users.find(u => u.role === 'TECHNICIAN')?.id || users[1].id,
        actualStartDate: new Date('2024-12-14T09:00:00Z'),
        scheduledStartDate: new Date('2024-12-14T08:00:00Z'),
        scheduledEndDate: new Date('2024-12-14T17:00:00Z'),
      },
      {
        title: 'Quarterly HVAC system inspection',
        description: 'Perform routine quarterly inspection of all HVAC systems including filter changes, belt inspections, and performance testing.',
        status: WorkOrderStatus.COMPLETED,
        priority: WorkOrderPriority.MEDIUM,
        type: WorkOrderType.INSPECTION,
        estimatedHours: 8,
        actualHours: 7,
        estimatedCost: 200,
        actualCost: 180,
        requestedById: users.find(u => u.role === 'MANAGER')?.id || users[0].id,
        assignedToId: users.find(u => u.role === 'TECHNICIAN')?.id || users[1].id,
        actualStartDate: new Date('2024-12-10T08:00:00Z'),
        actualEndDate: new Date('2024-12-10T15:00:00Z'),
        scheduledStartDate: new Date('2024-12-10T08:00:00Z'),
        scheduledEndDate: new Date('2024-12-10T16:00:00Z'),
        completionNotes: 'All HVAC systems inspected successfully. Replaced 12 filters and tightened 3 belts. System performance is optimal.',
      },
      {
        title: 'Install new security cameras',
        description: 'Install 4 new security cameras in the parking lot area to improve surveillance coverage.',
        status: WorkOrderStatus.PENDING,
        priority: WorkOrderPriority.LOW,
        type: WorkOrderType.INSTALLATION,
        estimatedHours: 12,
        estimatedCost: 800,
        requestedById: users.find(u => u.role === 'ADMINISTRATOR')?.id || users[0].id,
        scheduledStartDate: new Date('2024-12-20T08:00:00Z'),
        scheduledEndDate: new Date('2024-12-20T20:00:00Z'),
      },
      {
        title: 'Emergency - Water leak in server room',
        description: 'URGENT: Water leak detected in server room from ceiling. Immediate attention required to prevent equipment damage.',
        status: WorkOrderStatus.OPEN,
        priority: WorkOrderPriority.CRITICAL,
        type: WorkOrderType.EMERGENCY,
        estimatedHours: 2,
        estimatedCost: 150,
        requestedById: users.find(u => u.role === 'ADMINISTRATOR')?.id || users[0].id,
        scheduledStartDate: new Date(),
        scheduledEndDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      },
    ];

    const workOrders = [];
    for (const workOrderData of sampleWorkOrders) {
      const workOrder = await this.create(workOrderData);
      workOrders.push(workOrder);
    }

    return workOrders;
  }

  private async generateWorkOrderNumber(): Promise<string> {
    const count = await this.workOrderRepository.count();
    const year = new Date().getFullYear();
    return `WO-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  /**
   * Check for scheduling conflicts before assigning a work order
   */
  async checkScheduleConflicts(workOrder: Partial<WorkOrder> & { assignedToId?: string; scheduledStartDate?: Date; estimatedHours?: number }): Promise<ScheduleConflictWarning[]> {
    const warnings: ScheduleConflictWarning[] = [];

    if (!workOrder.assignedToId || !workOrder.scheduledStartDate || !workOrder.estimatedHours) {
      return warnings;
    }

    try {
      // Get technician info
      const technician = await this.findTechnicianById(workOrder.assignedToId);
      if (!technician) {
        return warnings;
      }

      // Get or create schedule for the date
      const scheduleDate = new Date(workOrder.scheduledStartDate);
      scheduleDate.setHours(0, 0, 0, 0); // Normalize to start of day

      let schedule;
      try {
        schedule = await this.schedulingService.findByTechnicianAndDateRange(
          workOrder.assignedToId,
          scheduleDate,
          scheduleDate
        );
        schedule = schedule[0]; // Get first (and only) result
      } catch (error) {
        // Schedule doesn't exist, will be created
        schedule = null;
      }

      const currentScheduledHours = schedule ? schedule.scheduledHours : 0;
      const availableHours = schedule ? schedule.availableHours : 8;
      const newScheduledHours = currentScheduledHours + workOrder.estimatedHours;
      const currentUtilization = availableHours > 0 ? Math.round((currentScheduledHours / availableHours) * 100) : 0;
      const newUtilization = availableHours > 0 ? Math.round((newScheduledHours / availableHours) * 100) : 0;

      // Check for over-allocation
      if (newUtilization > 100) {
        warnings.push({
          message: `Assigning this work order will over-allocate ${technician.fullName} on ${scheduleDate.toISOString().split('T')[0]}`,
          severity: 'error',
          technicianName: technician.fullName,
          date: scheduleDate.toISOString().split('T')[0],
          currentUtilization,
          newUtilization,
          scheduledHours: newScheduledHours,
          availableHours,
        });
      } else if (newUtilization > 90) {
        warnings.push({
          message: `Assigning this work order will result in high utilization (${newUtilization}%) for ${technician.fullName} on ${scheduleDate.toISOString().split('T')[0]}`,
          severity: 'warning',
          technicianName: technician.fullName,
          date: scheduleDate.toISOString().split('T')[0],
          currentUtilization,
          newUtilization,
          scheduledHours: newScheduledHours,
          availableHours,
        });
      }
    } catch (error) {
      this.logger.error(`Error checking schedule conflicts: ${error.message}`, error.stack);
    }

    return warnings;
  }

  /**
   * Assign work order with conflict detection
   */
  async assignWorkOrder(
    workOrderId: string,
    assignedToId: string,
    scheduledStartDate?: Date,
    estimatedHours?: number
  ): Promise<{ workOrder: WorkOrder; warnings: ScheduleConflictWarning[] }> {
    const workOrder = await this.findById(workOrderId);
    if (!workOrder) {
      throw new Error(`Work order with ID ${workOrderId} not found`);
    }

    // Update work order with assignment details
    const updateData: Partial<WorkOrder> = {
      assignedToId,
      scheduledStartDate: scheduledStartDate || workOrder.scheduledStartDate,
      estimatedHours: estimatedHours || workOrder.estimatedHours,
    };

    // No conflict checking - allow all assignments

    // Proceed with assignment
    const updatedWorkOrder = await this.update(workOrderId, updateData);

    // Recalculate hours for both old and new technicians if they changed
    if (workOrder.assignedToId !== assignedToId) {
      // Recalculate for old technician if they had a scheduled date
      if (workOrder.assignedToId && workOrder.scheduledStartDate) {
        const oldScheduleDate = new Date(workOrder.scheduledStartDate);
        oldScheduleDate.setHours(0, 0, 0, 0);
        await this.recalculateScheduleHours(workOrder.assignedToId, oldScheduleDate);
      }
      
      // Recalculate for new technician
      if (updatedWorkOrder.assignedToId && updatedWorkOrder.scheduledStartDate) {
        const newScheduleDate = new Date(updatedWorkOrder.scheduledStartDate);
        newScheduleDate.setHours(0, 0, 0, 0);
        await this.recalculateScheduleHours(updatedWorkOrder.assignedToId, newScheduleDate);
      }
    } else if (updatedWorkOrder.assignedToId && updatedWorkOrder.scheduledStartDate) {
      // Same technician but potentially different date - recalculate for the new date
      const scheduleDate = new Date(updatedWorkOrder.scheduledStartDate);
      scheduleDate.setHours(0, 0, 0, 0);
      await this.recalculateScheduleHours(updatedWorkOrder.assignedToId, scheduleDate);
      
      // If the date changed, also recalculate for the old date
      if (workOrder.scheduledStartDate && 
          workOrder.scheduledStartDate.getTime() !== updatedWorkOrder.scheduledStartDate.getTime()) {
        const oldScheduleDate = new Date(workOrder.scheduledStartDate);
        oldScheduleDate.setHours(0, 0, 0, 0);
        await this.recalculateScheduleHours(updatedWorkOrder.assignedToId, oldScheduleDate);
      }
    }

    // Emit WebSocket event for work order reassignment
    if (workOrder.assignedToId !== assignedToId || 
        (scheduledStartDate && workOrder.scheduledStartDate?.getTime() !== scheduledStartDate.getTime())) {
      
      const fromDate = workOrder.scheduledStartDate ? 
        workOrder.scheduledStartDate.toISOString().split('T')[0] : '';
      const toDate = scheduledStartDate ? 
        scheduledStartDate.toISOString().split('T')[0] : '';

      this.workOrdersGateway.emitWorkOrderReassignment({
        workOrderId: workOrder.id,
        workOrderNumber: workOrder.workOrderNumber,
        fromTechnicianId: workOrder.assignedToId || '',
        toTechnicianId: assignedToId,
        fromDate,
        toDate,
        estimatedHours: estimatedHours || workOrder.estimatedHours || 0,
      });

    }

    // Refetch the work order to get updated estimated hours and assigned technician info
    const finalWorkOrder = await this.findById(workOrderId);
    
    return {
      workOrder: finalWorkOrder,
      warnings: [],
    };
  }

  /**
   * Update schedule when work order is assigned
   */
  private async updateScheduleForWorkOrder(workOrder: WorkOrder): Promise<void> {
    if (!workOrder.assignedToId || !workOrder.scheduledStartDate) {
      return;
    }

    const scheduleDate = new Date(workOrder.scheduledStartDate);
    scheduleDate.setHours(0, 0, 0, 0); // Normalize to start of day

    // Calculate total scheduled hours based on work order count for the day
    await this.recalculateScheduleHours(workOrder.assignedToId, scheduleDate);

    this.logger.log(
      `Updated schedule for technician ${workOrder.assignedToId} on ${scheduleDate.toISOString().split('T')[0]} based on job count`
    );
  }

  /**
   * Recalculate schedule hours based on work order count for the day
   */
  private async recalculateScheduleHours(technicianId: string, date: Date): Promise<void> {
    const lockKey = `${technicianId}-${date.toISOString().split('T')[0]}`;
    
    // Check if there's already a recalculation in progress for this technician/date
    const existingLock = this.recalculationLocks.get(lockKey);
    if (existingLock) {
      // Wait for the existing recalculation to complete
      await existingLock;
      return;
    }

    // Create a new recalculation promise
    const recalculationPromise = this.performRecalculation(technicianId, date, lockKey);
    this.recalculationLocks.set(lockKey, recalculationPromise);
    
    try {
      await recalculationPromise;
    } finally {
      // Clean up the lock
      this.recalculationLocks.delete(lockKey);
    }
  }

  private async performRecalculation(technicianId: string, date: Date, lockKey: string): Promise<void> {
    try {
      this.logger.log(`Starting recalculation for ${lockKey}`);

      // Count work orders assigned to this technician on this date
      const workOrderCount = await this.workOrderRepository.count({
        where: {
          assignedToId: technicianId,
          scheduledStartDate: date,
        },
      });

      // Calculate hours per job (8 hours divided by number of jobs)
      const totalHours = workOrderCount > 0 ? 8 : 0;
      const hoursPerJob = workOrderCount > 0 ? 8 / workOrderCount : 0;

      // Update all work orders for this technician on this date with the calculated hours
      if (workOrderCount > 0) {
        await this.workOrderRepository.update(
          {
            assignedToId: technicianId,
            scheduledStartDate: date,
          },
          {
            estimatedHours: hoursPerJob,
          }
        );
      }

      // Update the schedule with total hours
      await this.schedulingService.setScheduledHours(technicianId, date, totalHours);

      this.logger.log(
        `Recalculated schedule: ${workOrderCount} jobs × ${hoursPerJob.toFixed(2)} hours = ${totalHours} total hours for technician ${technicianId} on ${date.toISOString().split('T')[0]}`
      );
    } catch (error) {
      this.logger.error(`Failed to recalculate schedule hours: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove scheduled hours when work order assignment is removed
   */
  private async removeScheduleForWorkOrder(workOrder: WorkOrder): Promise<void> {
    if (!workOrder.assignedToId || !workOrder.scheduledStartDate) {
      return;
    }

    const scheduleDate = new Date(workOrder.scheduledStartDate);
    scheduleDate.setHours(0, 0, 0, 0); // Normalize to start of day

    try {
      // Recalculate schedule hours after removing the work order
      await this.recalculateScheduleHours(workOrder.assignedToId, scheduleDate);
    } catch (error) {
      this.logger.warn(`Failed to recalculate schedule after removing work order ${workOrder.id}: ${error.message}`);
    }

    this.logger.log(
      `Recalculated schedule for technician ${workOrder.assignedToId} on ${scheduleDate.toISOString().split('T')[0]} after job removal`
    );
  }

  /**
   * Helper method to find technician by ID
   */
  private async findTechnicianById(technicianId: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: technicianId },
      });
      
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        fullName: user.fullName || `${user.firstName} ${user.lastName}`.trim() || 'Unknown Technician',
      };
    } catch (error) {
      this.logger.error(`Failed to find technician ${technicianId}: ${error.message}`);
      return {
        id: technicianId,
        fullName: 'Unknown Technician',
      };
    }
  }
} 