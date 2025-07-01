"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WorkOrdersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkOrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const work_order_entity_1 = require("./entities/work-order.entity");
const work_order_comment_entity_1 = require("./entities/work-order-comment.entity");
const work_order_attachment_entity_1 = require("./entities/work-order-attachment.entity");
const user_entity_1 = require("../users/entities/user.entity");
const cache_service_1 = require("../cache/cache.service");
const scheduling_service_1 = require("../scheduling/scheduling.service");
const work_orders_gateway_1 = require("../websocket/work-orders.gateway");
const typeorm_3 = require("typeorm");
const fs = require("fs");
let WorkOrdersService = WorkOrdersService_1 = class WorkOrdersService {
    constructor(workOrderRepository, commentRepository, attachmentRepository, userRepository, cacheService, schedulingService, workOrdersGateway) {
        this.workOrderRepository = workOrderRepository;
        this.commentRepository = commentRepository;
        this.attachmentRepository = attachmentRepository;
        this.userRepository = userRepository;
        this.cacheService = cacheService;
        this.schedulingService = schedulingService;
        this.workOrdersGateway = workOrdersGateway;
        this.logger = new common_1.Logger(WorkOrdersService_1.name);
        this.recalculationLocks = new Map();
    }
    async findAll(filters) {
        const query = this.workOrderRepository
            .createQueryBuilder('workOrder')
            .leftJoinAndSelect('workOrder.assignedTo', 'assignedTo')
            .leftJoinAndSelect('workOrder.asset', 'asset')
            .leftJoinAndSelect('workOrder.customer', 'customer');
        if (filters?.status) {
            query.andWhere('workOrder.status = :status', { status: filters.status });
        }
        if (filters?.assignedTo) {
            query.andWhere('workOrder.assignedToId = :assignedTo', { assignedTo: filters.assignedTo });
        }
        if (filters?.priority) {
            query.andWhere('workOrder.priority = :priority', { priority: filters.priority });
        }
        if (filters?.type) {
            query.andWhere('workOrder.type = :type', { type: filters.type });
        }
        if (filters?.search) {
            const searchTerm = `%${filters.search.toLowerCase()}%`;
            query.andWhere(`(LOWER(workOrder.title) LIKE :search 
         OR LOWER(workOrder.description) LIKE :search 
         OR LOWER(workOrder.workOrderNumber) LIKE :search
         OR LOWER(CONCAT(assignedTo.firstName, ' ', assignedTo.lastName)) LIKE :search)`, { search: searchTerm });
        }
        if (filters?.tags && filters.tags.length > 0) {
            const tagConditions = filters.tags.map((tag, index) => `workOrder.tags LIKE :tag${index}`);
            const tagParams = filters.tags.reduce((params, tag, index) => {
                params[`tag${index}`] = `%"${tag}"%`;
                return params;
            }, {});
            query.andWhere(`(${tagConditions.join(' OR ')})`, tagParams);
        }
        if (filters?.dateFrom) {
            query.andWhere('workOrder.createdAt >= :dateFrom', { dateFrom: new Date(filters.dateFrom) });
        }
        if (filters?.dateTo) {
            const endDate = new Date(filters.dateTo);
            endDate.setHours(23, 59, 59, 999);
            query.andWhere('workOrder.createdAt <= :dateTo', { dateTo: endDate });
        }
        if (filters?.overdueOnly) {
            const today = new Date();
            query.andWhere('workOrder.scheduledEndDate < :today', { today })
                .andWhere('workOrder.status NOT IN (:...completedStatuses)', {
                completedStatuses: [work_order_entity_1.WorkOrderStatus.COMPLETED, work_order_entity_1.WorkOrderStatus.CANCELLED, work_order_entity_1.WorkOrderStatus.CLOSED],
            });
        }
        if (filters?.limit) {
            query.limit(filters.limit);
        }
        if (filters?.offset) {
            query.offset(filters.offset);
        }
        query.orderBy('workOrder.createdAt', 'DESC');
        return query.getMany();
    }
    async findById(id) {
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
    async create(workOrderData) {
        if (!workOrderData.workOrderNumber) {
            workOrderData.workOrderNumber = await this.generateWorkOrderNumber();
        }
        const workOrder = this.workOrderRepository.create(workOrderData);
        const savedWorkOrder = await this.workOrderRepository.save(workOrder);
        await this.cacheService.invalidateWorkOrderCaches();
        return savedWorkOrder;
    }
    async update(id, updateData) {
        const { comments, attachments, timeEntries, assignedTo, asset, customer, assignedUsers, workOrderTags, ...updateFields } = updateData;
        const existingWorkOrder = await this.findById(id);
        if (!existingWorkOrder) {
            throw new Error('Work order not found');
        }
        const schedulingChanged = (updateFields.assignedToId !== existingWorkOrder.assignedToId ||
            updateFields.scheduledStartDate !== existingWorkOrder.scheduledStartDate ||
            updateFields.estimatedHours !== existingWorkOrder.estimatedHours);
        if (assignedUsers !== undefined) {
            existingWorkOrder.assignedUsers = assignedUsers;
        }
        if (workOrderTags !== undefined) {
            existingWorkOrder.workOrderTags = workOrderTags;
        }
        Object.assign(existingWorkOrder, updateFields);
        const updatedWorkOrder = await this.workOrderRepository.save(existingWorkOrder);
        await this.cacheService.invalidateWorkOrderCaches();
        return updatedWorkOrder;
    }
    async updateStatus(id, status, completionNotes, billingStatus) {
        const updateData = { status };
        if (status === work_order_entity_1.WorkOrderStatus.COMPLETED) {
            updateData.actualEndDate = new Date();
            if (completionNotes) {
                updateData.completionNotes = completionNotes;
            }
        }
        if (status === work_order_entity_1.WorkOrderStatus.IN_PROGRESS) {
            updateData.actualStartDate = new Date();
        }
        if (billingStatus) {
            updateData.billingStatus = billingStatus;
        }
        return this.update(id, updateData);
    }
    async delete(id) {
        const result = await this.workOrderRepository.delete(id);
        if (result.affected === 0) {
            throw new Error('Work order not found');
        }
        await this.cacheService.invalidateWorkOrderCaches();
    }
    async findOverdue() {
        const today = new Date();
        return this.workOrderRepository
            .createQueryBuilder('workOrder')
            .leftJoinAndSelect('workOrder.assignedTo', 'assignedTo')
            .leftJoinAndSelect('workOrder.asset', 'asset')
            .where('workOrder.scheduledEndDate < :today', { today })
            .andWhere('workOrder.status NOT IN (:...completedStatuses)', {
            completedStatuses: [work_order_entity_1.WorkOrderStatus.COMPLETED, work_order_entity_1.WorkOrderStatus.CANCELLED, work_order_entity_1.WorkOrderStatus.CLOSED],
        })
            .orderBy('workOrder.scheduledEndDate', 'ASC')
            .getMany();
    }
    async getDashboardStats() {
        const cacheKey = 'dashboard_stats';
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        const result = await this.workOrderRepository
            .createQueryBuilder('workOrder')
            .select([
            `SUM(CASE WHEN workOrder.status = '${work_order_entity_1.WorkOrderStatus.OPEN}' THEN 1 ELSE 0 END) as open`,
            `SUM(CASE WHEN workOrder.status = '${work_order_entity_1.WorkOrderStatus.IN_PROGRESS}' THEN 1 ELSE 0 END) as inProgress`,
            `SUM(CASE WHEN workOrder.status = '${work_order_entity_1.WorkOrderStatus.COMPLETED}' THEN 1 ELSE 0 END) as completed`,
            `SUM(CASE WHEN workOrder.scheduledEndDate < :today AND workOrder.status NOT IN ('${work_order_entity_1.WorkOrderStatus.COMPLETED}', '${work_order_entity_1.WorkOrderStatus.CANCELLED}', '${work_order_entity_1.WorkOrderStatus.CLOSED}') THEN 1 ELSE 0 END) as overdue`,
            `SUM(CASE WHEN workOrder.status = '${work_order_entity_1.WorkOrderStatus.COMPLETED}' AND workOrder.actualEndDate >= :startOfDay AND workOrder.actualEndDate <= :endOfDay THEN 1 ELSE 0 END) as completedToday`,
        ])
            .setParameters({ today, startOfDay, endOfDay })
            .getRawOne();
        const stats = {
            open: parseInt(result.open) || 0,
            inProgress: parseInt(result.inProgress) || 0,
            completed: parseInt(result.completed) || 0,
            overdue: parseInt(result.overdue) || 0,
            completedToday: parseInt(result.completedToday) || 0,
        };
        await this.cacheService.set(cacheKey, stats, 120);
        return stats;
    }
    async getDashboardStatsForUser(userId) {
        const cacheKey = `dashboard_stats_user_${userId}`;
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
        const [open, inProgress, completed, overdue, completedToday,] = await Promise.all([
            this.workOrderRepository.count({
                where: {
                    status: work_order_entity_1.WorkOrderStatus.OPEN,
                    assignedToId: userId
                }
            }),
            this.workOrderRepository.count({
                where: {
                    status: work_order_entity_1.WorkOrderStatus.IN_PROGRESS,
                    assignedToId: userId
                }
            }),
            this.workOrderRepository.count({
                where: {
                    status: work_order_entity_1.WorkOrderStatus.COMPLETED,
                    assignedToId: userId
                }
            }),
            this.workOrderRepository.count({
                where: {
                    scheduledEndDate: new Date(),
                    status: work_order_entity_1.WorkOrderStatus.OPEN,
                    assignedToId: userId,
                },
            }),
            this.workOrderRepository.count({
                where: {
                    status: work_order_entity_1.WorkOrderStatus.COMPLETED,
                    actualEndDate: new Date(),
                    assignedToId: userId,
                },
            }),
        ]);
        const stats = {
            open,
            inProgress,
            completed,
            overdue,
            completedToday,
        };
        await this.cacheService.set(cacheKey, stats, 120);
        return stats;
    }
    async findOverdueByUser(userId) {
        const today = new Date();
        return this.workOrderRepository
            .createQueryBuilder('workOrder')
            .leftJoinAndSelect('workOrder.assignedTo', 'assignedTo')
            .leftJoinAndSelect('workOrder.asset', 'asset')
            .where('workOrder.scheduledEndDate < :today', { today })
            .andWhere('workOrder.status NOT IN (:...completedStatuses)', {
            completedStatuses: [work_order_entity_1.WorkOrderStatus.COMPLETED, work_order_entity_1.WorkOrderStatus.CANCELLED, work_order_entity_1.WorkOrderStatus.CLOSED],
        })
            .andWhere('workOrder.assignedToId = :userId', { userId })
            .orderBy('workOrder.scheduledEndDate', 'ASC')
            .getMany();
    }
    async findScheduledWorkOrders(filters) {
        try {
            this.logger.log(`Finding scheduled work orders with filters: ${JSON.stringify(filters)}`);
            if (!filters.startDate || !filters.endDate) {
                throw new Error('Start date and end date are required');
            }
            const startDate = new Date(filters.startDate);
            const endDate = new Date(filters.endDate);
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new Error('Invalid date format provided');
            }
            endDate.setHours(23, 59, 59, 999);
            this.logger.log(`Parsed dates - Start: ${startDate.toISOString()}, End: ${endDate.toISOString()}`);
            const queryBuilder = this.workOrderRepository
                .createQueryBuilder('workOrder');
            try {
                queryBuilder
                    .leftJoinAndSelect('workOrder.assignedTo', 'assignedTo')
                    .leftJoinAndSelect('workOrder.asset', 'asset')
                    .leftJoinAndSelect('workOrder.customer', 'customer');
            }
            catch (joinError) {
                this.logger.warn('Warning: Some relations may not be available', joinError.message);
            }
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
        }
        catch (error) {
            this.logger.error(`Failed to find scheduled work orders: ${error.message}`, error.stack);
            throw new Error(`Failed to fetch scheduled work orders: ${error.message}`);
        }
    }
    async findActiveWorkOrders(filters) {
        const query = this.workOrderRepository.createQueryBuilder('workOrder')
            .leftJoinAndSelect('workOrder.assignedTo', 'assignedTo')
            .leftJoinAndSelect('workOrder.asset', 'asset')
            .leftJoinAndSelect('workOrder.customer', 'customer')
            .where('workOrder.status IN (:...activeStatuses)', {
            activeStatuses: ['open', 'in_progress', 'pending', 'assigned']
        });
        if (filters?.search) {
            query.andWhere('(workOrder.workOrderNumber ILIKE :search OR workOrder.title ILIKE :search OR workOrder.description ILIKE :search OR customer.name ILIKE :search)', { search: `%${filters.search}%` });
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
    async addComment(workOrderId, content, authorId, isInternal = false) {
        const comment = this.commentRepository.create({
            workOrderId,
            content,
            authorId,
            isInternal,
        });
        return this.commentRepository.save(comment);
    }
    async addAttachment(workOrderId, fileName, originalName, mimeType, fileSize, filePath, uploadedById, description) {
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
    async getAttachmentById(attachmentId) {
        return this.attachmentRepository.findOne({
            where: { id: attachmentId },
            relations: ['uploadedBy'],
        });
    }
    async deleteAttachment(attachmentId) {
        const attachment = await this.getAttachmentById(attachmentId);
        if (!attachment) {
            throw new Error('Attachment not found');
        }
        try {
            await fs.promises.unlink(attachment.filePath);
        }
        catch (error) {
            console.warn('Failed to delete attachment file:', error);
        }
        await this.attachmentRepository.delete(attachmentId);
    }
    async getAllTags() {
        const workOrders = await this.workOrderRepository.find({
            where: { tags: (0, typeorm_3.Not)((0, typeorm_3.IsNull)()) }
        });
        const tagSet = new Set();
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
                }
                catch (error) {
                }
            }
        });
        return Array.from(tagSet).sort();
    }
    async seedSampleWorkOrders() {
        const existingWorkOrders = await this.workOrderRepository.count();
        if (existingWorkOrders > 0) {
            return this.findAll();
        }
        const users = await this.workOrderRepository.manager.find('User');
        if (users.length === 0) {
            throw new Error('Please seed users first by calling POST /api/users/seed');
        }
        const sampleWorkOrders = [
            {
                title: 'Fix broken air conditioning unit',
                description: 'The AC unit in conference room B is not cooling properly. Temperature sensors show it\'s running 10+ degrees warmer than set point.',
                status: work_order_entity_1.WorkOrderStatus.OPEN,
                priority: work_order_entity_1.WorkOrderPriority.HIGH,
                type: work_order_entity_1.WorkOrderType.REPAIR,
                estimatedHours: 4,
                estimatedCost: 250,
                requestedById: users.find(u => u.role === 'REQUESTER')?.id || users[0].id,
                scheduledStartDate: new Date('2024-12-15T08:00:00Z'),
                scheduledEndDate: new Date('2024-12-15T12:00:00Z'),
            },
            {
                title: 'Replace fluorescent lights with LED',
                description: 'Replace old fluorescent light fixtures with energy-efficient LED fixtures in the main office area.',
                status: work_order_entity_1.WorkOrderStatus.IN_PROGRESS,
                priority: work_order_entity_1.WorkOrderPriority.MEDIUM,
                type: work_order_entity_1.WorkOrderType.MAINTENANCE,
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
                status: work_order_entity_1.WorkOrderStatus.COMPLETED,
                priority: work_order_entity_1.WorkOrderPriority.MEDIUM,
                type: work_order_entity_1.WorkOrderType.INSPECTION,
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
                status: work_order_entity_1.WorkOrderStatus.PENDING,
                priority: work_order_entity_1.WorkOrderPriority.LOW,
                type: work_order_entity_1.WorkOrderType.INSTALLATION,
                estimatedHours: 12,
                estimatedCost: 800,
                requestedById: users.find(u => u.role === 'ADMINISTRATOR')?.id || users[0].id,
                scheduledStartDate: new Date('2024-12-20T08:00:00Z'),
                scheduledEndDate: new Date('2024-12-20T20:00:00Z'),
            },
            {
                title: 'Emergency - Water leak in server room',
                description: 'URGENT: Water leak detected in server room from ceiling. Immediate attention required to prevent equipment damage.',
                status: work_order_entity_1.WorkOrderStatus.OPEN,
                priority: work_order_entity_1.WorkOrderPriority.CRITICAL,
                type: work_order_entity_1.WorkOrderType.EMERGENCY,
                estimatedHours: 2,
                estimatedCost: 150,
                requestedById: users.find(u => u.role === 'ADMINISTRATOR')?.id || users[0].id,
                scheduledStartDate: new Date(),
                scheduledEndDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
            },
        ];
        const workOrders = [];
        for (const workOrderData of sampleWorkOrders) {
            const workOrder = await this.create(workOrderData);
            workOrders.push(workOrder);
        }
        return workOrders;
    }
    async generateWorkOrderNumber() {
        const count = await this.workOrderRepository.count();
        const year = new Date().getFullYear();
        return `WO-${year}-${String(count + 1).padStart(6, '0')}`;
    }
    async checkScheduleConflicts(workOrder) {
        const warnings = [];
        if (!workOrder.assignedToId || !workOrder.scheduledStartDate || !workOrder.estimatedHours) {
            return warnings;
        }
        try {
            const technician = await this.findTechnicianById(workOrder.assignedToId);
            if (!technician) {
                return warnings;
            }
            const scheduleDate = new Date(workOrder.scheduledStartDate);
            scheduleDate.setHours(0, 0, 0, 0);
            let schedule;
            try {
                schedule = await this.schedulingService.findByTechnicianAndDateRange(workOrder.assignedToId, scheduleDate, scheduleDate);
                schedule = schedule[0];
            }
            catch (error) {
                schedule = null;
            }
            const currentScheduledHours = schedule ? schedule.scheduledHours : 0;
            const availableHours = schedule ? schedule.availableHours : 8;
            const newScheduledHours = currentScheduledHours + workOrder.estimatedHours;
            const currentUtilization = availableHours > 0 ? Math.round((currentScheduledHours / availableHours) * 100) : 0;
            const newUtilization = availableHours > 0 ? Math.round((newScheduledHours / availableHours) * 100) : 0;
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
            }
            else if (newUtilization > 90) {
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
        }
        catch (error) {
            this.logger.error(`Error checking schedule conflicts: ${error.message}`, error.stack);
        }
        return warnings;
    }
    async assignWorkOrder(workOrderId, assignedToId, scheduledStartDate, estimatedHours) {
        const workOrder = await this.findById(workOrderId);
        if (!workOrder) {
            throw new Error(`Work order with ID ${workOrderId} not found`);
        }
        const updateData = {
            assignedToId,
            scheduledStartDate: scheduledStartDate || workOrder.scheduledStartDate,
            estimatedHours: estimatedHours || workOrder.estimatedHours,
        };
        const updatedWorkOrder = await this.update(workOrderId, updateData);
        if (workOrder.assignedToId !== assignedToId) {
            if (workOrder.assignedToId && workOrder.scheduledStartDate) {
                const oldScheduleDate = new Date(workOrder.scheduledStartDate);
                oldScheduleDate.setHours(0, 0, 0, 0);
                await this.recalculateScheduleHours(workOrder.assignedToId, oldScheduleDate);
            }
            if (updatedWorkOrder.assignedToId && updatedWorkOrder.scheduledStartDate) {
                const newScheduleDate = new Date(updatedWorkOrder.scheduledStartDate);
                newScheduleDate.setHours(0, 0, 0, 0);
                await this.recalculateScheduleHours(updatedWorkOrder.assignedToId, newScheduleDate);
            }
        }
        else if (updatedWorkOrder.assignedToId && updatedWorkOrder.scheduledStartDate) {
            const scheduleDate = new Date(updatedWorkOrder.scheduledStartDate);
            scheduleDate.setHours(0, 0, 0, 0);
            await this.recalculateScheduleHours(updatedWorkOrder.assignedToId, scheduleDate);
            if (workOrder.scheduledStartDate &&
                workOrder.scheduledStartDate.getTime() !== updatedWorkOrder.scheduledStartDate.getTime()) {
                const oldScheduleDate = new Date(workOrder.scheduledStartDate);
                oldScheduleDate.setHours(0, 0, 0, 0);
                await this.recalculateScheduleHours(updatedWorkOrder.assignedToId, oldScheduleDate);
            }
        }
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
        const finalWorkOrder = await this.findById(workOrderId);
        return {
            workOrder: finalWorkOrder,
            warnings: [],
        };
    }
    async updateScheduleForWorkOrder(workOrder) {
        if (!workOrder.assignedToId || !workOrder.scheduledStartDate) {
            return;
        }
        const scheduleDate = new Date(workOrder.scheduledStartDate);
        scheduleDate.setHours(0, 0, 0, 0);
        await this.recalculateScheduleHours(workOrder.assignedToId, scheduleDate);
        this.logger.log(`Updated schedule for technician ${workOrder.assignedToId} on ${scheduleDate.toISOString().split('T')[0]} based on job count`);
    }
    async recalculateScheduleHours(technicianId, date) {
        const lockKey = `${technicianId}-${date.toISOString().split('T')[0]}`;
        const existingLock = this.recalculationLocks.get(lockKey);
        if (existingLock) {
            await existingLock;
            return;
        }
        const recalculationPromise = this.performRecalculation(technicianId, date, lockKey);
        this.recalculationLocks.set(lockKey, recalculationPromise);
        try {
            await recalculationPromise;
        }
        finally {
            this.recalculationLocks.delete(lockKey);
        }
    }
    async performRecalculation(technicianId, date, lockKey) {
        try {
            this.logger.log(`Starting recalculation for ${lockKey}`);
            const workOrderCount = await this.workOrderRepository.count({
                where: {
                    assignedToId: technicianId,
                    scheduledStartDate: date,
                },
            });
            const totalHours = workOrderCount > 0 ? 8 : 0;
            const hoursPerJob = workOrderCount > 0 ? 8 / workOrderCount : 0;
            if (workOrderCount > 0) {
                await this.workOrderRepository.update({
                    assignedToId: technicianId,
                    scheduledStartDate: date,
                }, {
                    estimatedHours: hoursPerJob,
                });
            }
            await this.schedulingService.setScheduledHours(technicianId, date, totalHours);
            this.logger.log(`Recalculated schedule: ${workOrderCount} jobs × ${hoursPerJob.toFixed(2)} hours = ${totalHours} total hours for technician ${technicianId} on ${date.toISOString().split('T')[0]}`);
        }
        catch (error) {
            this.logger.error(`Failed to recalculate schedule hours: ${error.message}`);
            throw error;
        }
    }
    async removeScheduleForWorkOrder(workOrder) {
        if (!workOrder.assignedToId || !workOrder.scheduledStartDate) {
            return;
        }
        const scheduleDate = new Date(workOrder.scheduledStartDate);
        scheduleDate.setHours(0, 0, 0, 0);
        try {
            await this.recalculateScheduleHours(workOrder.assignedToId, scheduleDate);
        }
        catch (error) {
            this.logger.warn(`Failed to recalculate schedule after removing work order ${workOrder.id}: ${error.message}`);
        }
        this.logger.log(`Recalculated schedule for technician ${workOrder.assignedToId} on ${scheduleDate.toISOString().split('T')[0]} after job removal`);
    }
    async findTechnicianById(technicianId) {
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
        }
        catch (error) {
            this.logger.error(`Failed to find technician ${technicianId}: ${error.message}`);
            return {
                id: technicianId,
                fullName: 'Unknown Technician',
            };
        }
    }
};
exports.WorkOrdersService = WorkOrdersService;
exports.WorkOrdersService = WorkOrdersService = WorkOrdersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(work_order_entity_1.WorkOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(work_order_comment_entity_1.WorkOrderComment)),
    __param(2, (0, typeorm_1.InjectRepository)(work_order_attachment_entity_1.WorkOrderAttachment)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(6, (0, common_1.Inject)((0, common_1.forwardRef)(() => work_orders_gateway_1.WorkOrdersGateway))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        cache_service_1.CacheService,
        scheduling_service_1.SchedulingService,
        work_orders_gateway_1.WorkOrdersGateway])
], WorkOrdersService);
//# sourceMappingURL=work-orders.service.js.map