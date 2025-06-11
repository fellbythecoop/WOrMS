import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkOrder, WorkOrderStatus, WorkOrderPriority, WorkOrderType } from './entities/work-order.entity';
import { WorkOrderComment } from './entities/work-order-comment.entity';
import { WorkOrderAttachment } from './entities/work-order-attachment.entity';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(WorkOrderComment)
    private readonly commentRepository: Repository<WorkOrderComment>,
    @InjectRepository(WorkOrderAttachment)
    private readonly attachmentRepository: Repository<WorkOrderAttachment>,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(filters?: {
    status?: WorkOrderStatus;
    assignedTo?: string;
    priority?: string;
    type?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    overdueOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<WorkOrder[]> {
    const query = this.workOrderRepository
      .createQueryBuilder('workOrder')
      .leftJoinAndSelect('workOrder.requestedBy', 'requestedBy')
      .leftJoinAndSelect('workOrder.assignedTo', 'assignedTo')
      .leftJoinAndSelect('workOrder.asset', 'asset')
      .leftJoinAndSelect('workOrder.comments', 'comments')
      .leftJoinAndSelect('workOrder.attachments', 'attachments');

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
         OR LOWER(CONCAT(assignedTo.firstName, ' ', assignedTo.lastName)) LIKE :search
         OR LOWER(CONCAT(requestedBy.firstName, ' ', requestedBy.lastName)) LIKE :search)`,
        { search: searchTerm }
      );
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
    return this.workOrderRepository.findOne({
      where: { id },
      relations: [
        'requestedBy',
        'assignedTo',
        'asset',
        'comments',
        'comments.author',
        'attachments',
        'attachments.uploadedBy',
      ],
    });
  }

  async create(workOrderData: Partial<WorkOrder>): Promise<WorkOrder> {
    // Generate work order number if not provided
    if (!workOrderData.workOrderNumber) {
      workOrderData.workOrderNumber = await this.generateWorkOrderNumber();
    }

    const workOrder = this.workOrderRepository.create(workOrderData);
    const savedWorkOrder = await this.workOrderRepository.save(workOrder);
    
    // Invalidate related caches
    await this.cacheService.invalidateWorkOrderCaches();
    
    return savedWorkOrder;
  }

  async update(id: string, updateData: Partial<WorkOrder>): Promise<WorkOrder> {
    await this.workOrderRepository.update(id, updateData);
    const updatedWorkOrder = await this.findById(id);
    if (!updatedWorkOrder) {
      throw new Error('Work order not found');
    }
    
    // Invalidate related caches
    await this.cacheService.invalidateWorkOrderCaches();
    
    return updatedWorkOrder;
  }

  async updateStatus(
    id: string,
    status: WorkOrderStatus,
    completionNotes?: string,
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
      .leftJoinAndSelect('workOrder.requestedBy', 'requestedBy')
      .leftJoinAndSelect('workOrder.assignedTo', 'assignedTo')
      .leftJoinAndSelect('workOrder.asset', 'asset')
      .where('workOrder.scheduledEndDate < :today', { today })
      .andWhere('workOrder.status NOT IN (:...completedStatuses)', {
        completedStatuses: [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED, WorkOrderStatus.CLOSED],
      })
      .orderBy('workOrder.scheduledEndDate', 'ASC')
      .getMany();
  }

  async getDashboardStats() {
    const cacheKey = this.cacheService.getDashboardStatsKey();
    
    // Try to get from cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const [
      totalOpen,
      totalInProgress,
      totalCompleted,
      totalOverdue,
    ] = await Promise.all([
      this.workOrderRepository.count({ where: { status: WorkOrderStatus.OPEN } }),
      this.workOrderRepository.count({ where: { status: WorkOrderStatus.IN_PROGRESS } }),
      this.workOrderRepository.count({ where: { status: WorkOrderStatus.COMPLETED } }),
      this.findOverdue().then(orders => orders.length),
    ]);

    const completedToday = await this.workOrderRepository
      .createQueryBuilder('workOrder')
      .where('workOrder.status = :status', { status: WorkOrderStatus.COMPLETED })
      .andWhere('DATE(workOrder.actualEndDate) = DATE(:today)', { today: new Date() })
      .getCount();

    const stats = {
      open: totalOpen,
      inProgress: totalInProgress,
      completed: totalCompleted,
      overdue: totalOverdue,
      completedToday,
    };

    // Cache for 2 minutes
    await this.cacheService.set(cacheKey, stats, 120);
    
    return stats;
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
} 