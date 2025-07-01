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
exports.WorkOrdersController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const work_orders_service_1 = require("./work-orders.service");
const time_entry_service_1 = require("./time-entry.service");
const dev_auth_guard_1 = require("../auth/guards/dev-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const require_permissions_decorator_1 = require("../auth/decorators/require-permissions.decorator");
const permissions_enum_1 = require("../auth/permissions/permissions.enum");
const work_order_entity_1 = require("./entities/work-order.entity");
const path = require("path");
const fs = require("fs");
let WorkOrdersController = class WorkOrdersController {
    constructor(workOrdersService, timeEntryService) {
        this.workOrdersService = workOrdersService;
        this.timeEntryService = timeEntryService;
    }
    async findAll(req, status, assignedTo, priority, type, search, tags, dateFrom, dateTo, overdueOnly, limit, offset) {
        const user = req.user;
        const canViewAll = user.role === 'administrator' || user.role === 'manager';
        if (!canViewAll) {
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
    async getAllTags() {
        return this.workOrdersService.getAllTags();
    }
    async findScheduledWorkOrders(req, startDate, endDate, technicianId, status) {
        try {
            if (!startDate || !endDate) {
                throw new Error('startDate and endDate are required parameters');
            }
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);
            if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
                throw new Error('Invalid date format. Please use YYYY-MM-DD format');
            }
            const user = req.user;
            if (!user) {
                throw new Error('User not authenticated');
            }
            const canViewAll = user.role === 'administrator' || user.role === 'manager';
            if (!canViewAll && !technicianId) {
                technicianId = user.id;
            }
            return this.workOrdersService.findScheduledWorkOrders({
                startDate,
                endDate,
                technicianId,
                status,
            });
        }
        catch (error) {
            console.error('Error in findScheduledWorkOrders:', error);
            throw error;
        }
    }
    async findActiveWorkOrders(req, search, status, priority, type) {
        return this.workOrdersService.findActiveWorkOrders({
            search,
            status,
            priority,
            type,
        });
    }
    async getTimeEntries(workOrderId, req) {
        const workOrder = await this.workOrdersService.findById(workOrderId);
        if (!workOrder) {
            throw new Error('Work order not found');
        }
        const user = req.user;
        const canViewAll = user.role === 'administrator' || user.role === 'manager';
        const isAssigned = workOrder.assignedTo?.id === user.id;
        if (!canViewAll && !isAssigned) {
            throw new Error('Access denied: You can only view time entries for work orders assigned to you');
        }
        return this.timeEntryService.getTimeEntriesByWorkOrder(workOrderId);
    }
    async addTimeEntry(workOrderId, timeEntryData, req) {
        const workOrder = await this.workOrdersService.findById(workOrderId);
        if (!workOrder) {
            throw new Error('Work order not found');
        }
        const user = req.user;
        const canUpdateAll = user.role === 'administrator' || user.role === 'manager';
        const isAssigned = workOrder.assignedTo?.id === user.id;
        if (!canUpdateAll && !isAssigned) {
            throw new Error('Access denied: You can only add time entries to work orders assigned to you');
        }
        const createTimeEntryDto = {
            ...timeEntryData,
            workOrderId,
            technicianId: timeEntryData.technicianId || user.id,
        };
        return this.timeEntryService.createTimeEntry(createTimeEntryDto);
    }
    async findOne(id, req) {
        const workOrder = await this.workOrdersService.findById(id);
        if (!workOrder) {
            throw new common_1.NotFoundException('Work order not found');
        }
        const user = req.user;
        const canViewAll = user.role === 'administrator' || user.role === 'manager';
        const isAssigned = workOrder.assignedTo?.id === user.id;
        if (!canViewAll && !isAssigned) {
            throw new Error('Access denied: You can only view work orders assigned to you');
        }
        return workOrder;
    }
    async create(createWorkOrderData, req) {
        return this.workOrdersService.create(createWorkOrderData);
    }
    async update(id, updateData, req) {
        const workOrder = await this.workOrdersService.findById(id);
        if (!workOrder) {
            throw new Error('Work order not found');
        }
        const user = req.user;
        const canUpdateAll = user.role === 'administrator' || user.role === 'manager';
        const isAssigned = workOrder.assignedTo?.id === user.id;
        if (!canUpdateAll && !isAssigned) {
            throw new Error('Access denied: You can only update work orders assigned to you');
        }
        return this.workOrdersService.update(id, updateData);
    }
    async updateStatus(id, statusData, req) {
        const workOrder = await this.workOrdersService.findById(id);
        if (!workOrder) {
            throw new Error('Work order not found');
        }
        const user = req.user;
        const canUpdateAll = user.role === 'administrator' || user.role === 'manager';
        const isAssigned = workOrder.assignedTo?.id === user.id;
        if (!canUpdateAll && !isAssigned) {
            throw new Error('Access denied: You can only update status of work orders assigned to you');
        }
        return this.workOrdersService.updateStatus(id, statusData.status, statusData.completionNotes, statusData.billingStatus);
    }
    async remove(id) {
        return this.workOrdersService.delete(id);
    }
    async updateTimeEntry(timeEntryId, updateData, req) {
        const timeEntry = await this.timeEntryService.getTimeEntryById(timeEntryId);
        const user = req.user;
        const canUpdateAll = user.role === 'administrator' || user.role === 'manager';
        const isTechnician = timeEntry.technicianId === user.id;
        if (!canUpdateAll && !isTechnician) {
            throw new Error('Access denied: You can only update your own time entries');
        }
        return this.timeEntryService.updateTimeEntry(timeEntryId, updateData);
    }
    async deleteTimeEntry(timeEntryId, req) {
        const timeEntry = await this.timeEntryService.getTimeEntryById(timeEntryId);
        const user = req.user;
        const canUpdateAll = user.role === 'administrator' || user.role === 'manager';
        const isTechnician = timeEntry.technicianId === user.id;
        if (!canUpdateAll && !isTechnician) {
            throw new Error('Access denied: You can only delete your own time entries');
        }
        return this.timeEntryService.deleteTimeEntry(timeEntryId);
    }
    async getDashboardStats(req) {
        const user = req.user;
        const canViewAll = user.role === 'administrator' || user.role === 'manager';
        if (canViewAll) {
            return this.workOrdersService.getDashboardStats();
        }
        else {
            return this.workOrdersService.getDashboardStatsForUser(user.id);
        }
    }
    async getOverdueWorkOrders(req) {
        const user = req.user;
        const canViewAll = user.role === 'administrator' || user.role === 'manager';
        if (canViewAll) {
            return this.workOrdersService.findOverdue();
        }
        else {
            return this.workOrdersService.findOverdueByUser(user.id);
        }
    }
    async addComment(id, commentData, req) {
        const workOrder = await this.workOrdersService.findById(id);
        if (!workOrder) {
            throw new Error('Work order not found');
        }
        const user = req.user;
        const canUpdateAll = user.role === 'administrator' || user.role === 'manager';
        const isAssigned = workOrder.assignedTo?.id === user.id;
        if (!canUpdateAll && !isAssigned) {
            throw new Error('Access denied: You can only add comments to work orders assigned to you');
        }
        return this.workOrdersService.addComment(id, commentData.content, user.id, commentData.isInternal || false);
    }
    async uploadAttachment(workOrderId, file, body, req) {
        const workOrder = await this.workOrdersService.findById(workOrderId);
        if (!workOrder) {
            throw new Error('Work order not found');
        }
        const user = req.user;
        const canUpdateAll = user.role === 'administrator' || user.role === 'manager';
        const isAssigned = workOrder.assignedTo?.id === user.id;
        if (!canUpdateAll && !isAssigned) {
            throw new Error('Access denied: You can only upload attachments to work orders assigned to you');
        }
        if (!file) {
            throw new Error('No file uploaded');
        }
        const uploadsDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.originalname}`;
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, file.buffer);
        return this.workOrdersService.addAttachment(workOrderId, fileName, file.originalname, file.mimetype, file.size, filePath, user.id, body.description);
    }
    async downloadAttachment(attachmentId, res, req) {
        const attachment = await this.workOrdersService.getAttachmentById(attachmentId);
        if (!attachment) {
            throw new Error('Attachment not found');
        }
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
    async deleteAttachment(attachmentId, req) {
        const attachment = await this.workOrdersService.getAttachmentById(attachmentId);
        if (!attachment) {
            throw new Error('Attachment not found');
        }
        const workOrder = await this.workOrdersService.findById(attachment.workOrderId);
        const user = req.user;
        const canDeleteAll = user.role === 'administrator' || user.role === 'manager';
        const isAssigned = workOrder.assignedTo?.id === user.id;
        if (!canDeleteAll && !isAssigned) {
            throw new Error('Access denied: You can only delete attachments from work orders assigned to you');
        }
        return this.workOrdersService.deleteAttachment(attachmentId);
    }
    async seedSampleWorkOrders() {
        return this.workOrdersService.seedSampleWorkOrders();
    }
    async assignWorkOrder(workOrderId, assignmentData, req) {
        try {
            const { assignedToId, scheduledStartDate, estimatedHours } = assignmentData;
            const scheduledDate = scheduledStartDate ? new Date(scheduledStartDate) : undefined;
            return await this.workOrdersService.assignWorkOrder(workOrderId, assignedToId, scheduledDate, estimatedHours);
        }
        catch (error) {
            if (error.message?.includes('not found')) {
                throw new common_1.NotFoundException(error.message);
            }
            throw error;
        }
    }
    async checkScheduleConflicts(workOrderId, assignmentData, req) {
        const workOrder = await this.workOrdersService.findById(workOrderId);
        if (!workOrder) {
            throw new Error('Work order not found');
        }
        const tempWorkOrder = {
            ...workOrder,
            assignedToId: assignmentData.assignedToId,
            scheduledStartDate: assignmentData.scheduledStartDate ? new Date(assignmentData.scheduledStartDate) : workOrder.scheduledStartDate,
            estimatedHours: assignmentData.estimatedHours ?? workOrder.estimatedHours,
        };
        return this.workOrdersService.checkScheduleConflicts(tempWorkOrder);
    }
};
exports.WorkOrdersController = WorkOrdersController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.VIEW_WORK_ORDERS, permissions_enum_1.Permission.VIEW_ALL_WORK_ORDERS),
    (0, swagger_1.ApiOperation)({ summary: 'Get all work orders with advanced filtering' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Work orders retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: work_order_entity_1.WorkOrderStatus, description: 'Filter by status' }),
    (0, swagger_1.ApiQuery)({ name: 'assignedTo', required: false, type: String, description: 'Filter by assigned user ID' }),
    (0, swagger_1.ApiQuery)({ name: 'priority', required: false, type: String, description: 'Filter by priority' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, type: String, description: 'Filter by work order type' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String, description: 'Text search across title, description, and WO number' }),
    (0, swagger_1.ApiQuery)({ name: 'dateFrom', required: false, type: String, description: 'Filter by created date from (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'dateTo', required: false, type: String, description: 'Filter by created date to (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'overdueOnly', required: false, type: Boolean, description: 'Show only overdue work orders' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Limit number of results (default: 100)' }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, type: Number, description: 'Offset for pagination (default: 0)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('assignedTo')),
    __param(3, (0, common_1.Query)('priority')),
    __param(4, (0, common_1.Query)('type')),
    __param(5, (0, common_1.Query)('search')),
    __param(6, (0, common_1.Query)('tags')),
    __param(7, (0, common_1.Query)('dateFrom')),
    __param(8, (0, common_1.Query)('dateTo')),
    __param(9, (0, common_1.Query)('overdueOnly')),
    __param(10, (0, common_1.Query)('limit')),
    __param(11, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String, String, Boolean, Number, Number]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('tags'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.VIEW_WORK_ORDERS, permissions_enum_1.Permission.VIEW_ALL_WORK_ORDERS),
    (0, swagger_1.ApiOperation)({ summary: 'Get all available tags' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Available tags retrieved successfully', type: [String] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "getAllTags", null);
__decorate([
    (0, common_1.Get)('scheduled'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.VIEW_WORK_ORDERS, permissions_enum_1.Permission.VIEW_ALL_WORK_ORDERS),
    (0, swagger_1.ApiOperation)({ summary: 'Get work orders by scheduled date range for calendar view' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'technicianId', required: false, description: 'Filter by technician ID' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter by status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Scheduled work orders retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('technicianId')),
    __param(4, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "findScheduledWorkOrders", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.VIEW_WORK_ORDERS, permissions_enum_1.Permission.VIEW_ALL_WORK_ORDERS),
    (0, swagger_1.ApiOperation)({ summary: 'Get active work orders that can be assigned/scheduled' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, description: 'Search by work order number, title, description, or customer name' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: work_order_entity_1.WorkOrderStatus, description: 'Filter by status' }),
    (0, swagger_1.ApiQuery)({ name: 'priority', required: false, type: String, description: 'Filter by priority' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, type: String, description: 'Filter by work order type' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Active work orders retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('priority')),
    __param(4, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "findActiveWorkOrders", null);
__decorate([
    (0, common_1.Get)(':id/time-entries'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.VIEW_WORK_ORDERS, permissions_enum_1.Permission.VIEW_ALL_WORK_ORDERS),
    (0, swagger_1.ApiOperation)({ summary: 'Get time entries for a work order' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Time entries retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "getTimeEntries", null);
__decorate([
    (0, common_1.Post)(':id/time-entries'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.UPDATE_WORK_ORDERS, permissions_enum_1.Permission.UPDATE_OWN_WORK_ORDERS),
    (0, swagger_1.ApiOperation)({ summary: 'Add time entry to work order' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Time entry added successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "addTimeEntry", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.VIEW_WORK_ORDERS, permissions_enum_1.Permission.VIEW_ALL_WORK_ORDERS),
    (0, swagger_1.ApiOperation)({ summary: 'Get work order by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Work order retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Work order not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.CREATE_WORK_ORDERS),
    (0, swagger_1.ApiOperation)({ summary: 'Create new work order' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Work order created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.UPDATE_WORK_ORDERS, permissions_enum_1.Permission.UPDATE_OWN_WORK_ORDERS),
    (0, swagger_1.ApiOperation)({ summary: 'Update work order' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Work order updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Work order not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.UPDATE_WORK_ORDERS, permissions_enum_1.Permission.UPDATE_OWN_WORK_ORDERS),
    (0, swagger_1.ApiOperation)({ summary: 'Update work order status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Work order status updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DELETE_WORK_ORDERS),
    (0, swagger_1.ApiOperation)({ summary: 'Delete work order' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Work order deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Work order not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "remove", null);
__decorate([
    (0, common_1.Put)('time-entries/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.UPDATE_WORK_ORDERS, permissions_enum_1.Permission.UPDATE_OWN_WORK_ORDERS),
    (0, swagger_1.ApiOperation)({ summary: 'Update time entry' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Time entry updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "updateTimeEntry", null);
__decorate([
    (0, common_1.Delete)('time-entries/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.UPDATE_WORK_ORDERS, permissions_enum_1.Permission.UPDATE_OWN_WORK_ORDERS),
    (0, swagger_1.ApiOperation)({ summary: 'Delete time entry' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Time entry deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "deleteTimeEntry", null);
__decorate([
    (0, common_1.Get)('stats/dashboard'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.VIEW_WORK_ORDERS, permissions_enum_1.Permission.VIEW_ALL_WORK_ORDERS),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard stats retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('overdue/list'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.VIEW_WORK_ORDERS, permissions_enum_1.Permission.VIEW_ALL_WORK_ORDERS),
    (0, swagger_1.ApiOperation)({ summary: 'Get overdue work orders' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Overdue work orders retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "getOverdueWorkOrders", null);
__decorate([
    (0, common_1.Post)(':id/comments'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.CREATE_COMMENTS),
    (0, swagger_1.ApiOperation)({ summary: 'Add comment to work order' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Comment added successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Work order not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "addComment", null);
__decorate([
    (0, common_1.Post)(':id/attachments'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload attachment to work order' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Attachment uploaded successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "uploadAttachment", null);
__decorate([
    (0, common_1.Get)('attachments/:id/download'),
    (0, swagger_1.ApiOperation)({ summary: 'Download attachment' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attachment downloaded successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "downloadAttachment", null);
__decorate([
    (0, common_1.Delete)('attachments/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DELETE_ANY_COMMENTS),
    (0, swagger_1.ApiOperation)({ summary: 'Delete attachment' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attachment deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "deleteAttachment", null);
__decorate([
    (0, common_1.Post)('seed'),
    (0, swagger_1.ApiOperation)({ summary: 'Seed sample work orders (development only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Sample work orders created successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "seedSampleWorkOrders", null);
__decorate([
    (0, common_1.Post)(':id/assign'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.UPDATE_WORK_ORDERS),
    (0, swagger_1.ApiOperation)({ summary: 'Assign work order to technician with automatic hour calculation' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Work order assigned successfully', schema: {
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
        } }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Work order not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "assignWorkOrder", null);
__decorate([
    (0, common_1.Post)(':id/check-conflicts'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.VIEW_WORK_ORDERS),
    (0, swagger_1.ApiOperation)({ summary: 'Check for schedule conflicts before assigning work order' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conflict check completed', type: [Object] }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "checkScheduleConflicts", null);
exports.WorkOrdersController = WorkOrdersController = __decorate([
    (0, swagger_1.ApiTags)('Work Orders'),
    (0, common_1.Controller)('work-orders'),
    (0, common_1.UseGuards)(dev_auth_guard_1.DevAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [work_orders_service_1.WorkOrdersService,
        time_entry_service_1.TimeEntryService])
], WorkOrdersController);
//# sourceMappingURL=work-orders.controller.js.map