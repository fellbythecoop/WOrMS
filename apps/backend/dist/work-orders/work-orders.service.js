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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkOrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const work_order_entity_1 = require("./entities/work-order.entity");
const work_order_comment_entity_1 = require("./entities/work-order-comment.entity");
const work_order_attachment_entity_1 = require("./entities/work-order-attachment.entity");
const cache_service_1 = require("../cache/cache.service");
const typeorm_3 = require("typeorm");
const fs = require("fs");
let WorkOrdersService = class WorkOrdersService {
    constructor(workOrderRepository, commentRepository, attachmentRepository, cacheService) {
        this.workOrderRepository = workOrderRepository;
        this.commentRepository = commentRepository;
        this.attachmentRepository = attachmentRepository;
        this.cacheService = cacheService;
    }
    async findAll(filters) {
        const query = this.workOrderRepository
            .createQueryBuilder('workOrder')
            .leftJoinAndSelect('workOrder.assignedTo', 'assignedTo')
            .leftJoinAndSelect('workOrder.asset', 'asset')
            .leftJoinAndSelect('workOrder.customer', 'customer')
            .leftJoinAndSelect('workOrder.comments', 'comments')
            .leftJoinAndSelect('workOrder.attachments', 'attachments')
            .leftJoinAndSelect('workOrder.timeEntries', 'timeEntries');
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
        return this.workOrderRepository.findOne({
            where: { id },
            relations: ['assignedTo', 'asset', 'customer', 'comments', 'comments.author', 'attachments', 'timeEntries', 'timeEntries.technician'],
        });
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
        const [open, inProgress, completed, overdue, completedToday,] = await Promise.all([
            this.workOrderRepository.count({ where: { status: work_order_entity_1.WorkOrderStatus.OPEN } }),
            this.workOrderRepository.count({ where: { status: work_order_entity_1.WorkOrderStatus.IN_PROGRESS } }),
            this.workOrderRepository.count({ where: { status: work_order_entity_1.WorkOrderStatus.COMPLETED } }),
            this.workOrderRepository.count({
                where: {
                    scheduledEndDate: new Date(),
                    status: work_order_entity_1.WorkOrderStatus.OPEN,
                },
            }),
            this.workOrderRepository.count({
                where: {
                    status: work_order_entity_1.WorkOrderStatus.COMPLETED,
                    actualEndDate: new Date(),
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
};
exports.WorkOrdersService = WorkOrdersService;
exports.WorkOrdersService = WorkOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(work_order_entity_1.WorkOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(work_order_comment_entity_1.WorkOrderComment)),
    __param(2, (0, typeorm_1.InjectRepository)(work_order_attachment_entity_1.WorkOrderAttachment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        cache_service_1.CacheService])
], WorkOrdersService);
//# sourceMappingURL=work-orders.service.js.map