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
let WorkOrdersService = class WorkOrdersService {
    constructor(workOrderRepository, commentRepository, attachmentRepository) {
        this.workOrderRepository = workOrderRepository;
        this.commentRepository = commentRepository;
        this.attachmentRepository = attachmentRepository;
    }
    async findAll(filters) {
        const query = this.workOrderRepository
            .createQueryBuilder('workOrder')
            .leftJoinAndSelect('workOrder.requestedBy', 'requestedBy')
            .leftJoinAndSelect('workOrder.assignedTo', 'assignedTo')
            .leftJoinAndSelect('workOrder.asset', 'asset')
            .leftJoinAndSelect('workOrder.comments', 'comments')
            .leftJoinAndSelect('workOrder.attachments', 'attachments');
        if (filters?.status) {
            query.andWhere('workOrder.status = :status', { status: filters.status });
        }
        if (filters?.assignedTo) {
            query.andWhere('workOrder.assignedToId = :assignedTo', { assignedTo: filters.assignedTo });
        }
        if (filters?.priority) {
            query.andWhere('workOrder.priority = :priority', { priority: filters.priority });
        }
        return query.orderBy('workOrder.createdAt', 'DESC').getMany();
    }
    async findById(id) {
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
    async create(workOrderData) {
        if (!workOrderData.workOrderNumber) {
            workOrderData.workOrderNumber = await this.generateWorkOrderNumber();
        }
        const workOrder = this.workOrderRepository.create(workOrderData);
        return this.workOrderRepository.save(workOrder);
    }
    async update(id, updateData) {
        await this.workOrderRepository.update(id, updateData);
        const updatedWorkOrder = await this.findById(id);
        if (!updatedWorkOrder) {
            throw new Error('Work order not found');
        }
        return updatedWorkOrder;
    }
    async updateStatus(id, status, completionNotes) {
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
        return this.update(id, updateData);
    }
    async delete(id) {
        const result = await this.workOrderRepository.delete(id);
        if (result.affected === 0) {
            throw new Error('Work order not found');
        }
    }
    async findOverdue() {
        const today = new Date();
        return this.workOrderRepository
            .createQueryBuilder('workOrder')
            .leftJoinAndSelect('workOrder.requestedBy', 'requestedBy')
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
        const [totalOpen, totalInProgress, totalCompleted, totalOverdue,] = await Promise.all([
            this.workOrderRepository.count({ where: { status: work_order_entity_1.WorkOrderStatus.OPEN } }),
            this.workOrderRepository.count({ where: { status: work_order_entity_1.WorkOrderStatus.IN_PROGRESS } }),
            this.workOrderRepository.count({ where: { status: work_order_entity_1.WorkOrderStatus.COMPLETED } }),
            this.findOverdue().then(orders => orders.length),
        ]);
        const completedToday = await this.workOrderRepository
            .createQueryBuilder('workOrder')
            .where('workOrder.status = :status', { status: work_order_entity_1.WorkOrderStatus.COMPLETED })
            .andWhere('DATE(workOrder.actualEndDate) = DATE(:today)', { today: new Date() })
            .getCount();
        return {
            open: totalOpen,
            inProgress: totalInProgress,
            completed: totalCompleted,
            overdue: totalOverdue,
            completedToday,
        };
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
        typeorm_2.Repository])
], WorkOrdersService);
//# sourceMappingURL=work-orders.service.js.map