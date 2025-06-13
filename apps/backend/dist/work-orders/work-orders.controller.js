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
const swagger_1 = require("@nestjs/swagger");
const work_orders_service_1 = require("./work-orders.service");
const dev_auth_guard_1 = require("../auth/guards/dev-auth.guard");
const work_order_entity_1 = require("./entities/work-order.entity");
let WorkOrdersController = class WorkOrdersController {
    constructor(workOrdersService) {
        this.workOrdersService = workOrdersService;
    }
    async findAll(status, assignedTo, priority, type, search, dateFrom, dateTo, overdueOnly, limit, offset) {
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
    async findOne(id) {
        const workOrder = await this.workOrdersService.findById(id);
        if (!workOrder) {
            throw new Error('Work order not found');
        }
        return workOrder;
    }
    async create(createWorkOrderData) {
        return this.workOrdersService.create(createWorkOrderData);
    }
    async update(id, updateData) {
        return this.workOrdersService.update(id, updateData);
    }
    async updateStatus(id, statusData) {
        return this.workOrdersService.updateStatus(id, statusData.status, statusData.completionNotes);
    }
    async remove(id) {
        return this.workOrdersService.delete(id);
    }
    async getDashboardStats() {
        return this.workOrdersService.getDashboardStats();
    }
    async getOverdueWorkOrders() {
        return this.workOrdersService.findOverdue();
    }
    async addComment(id, commentData) {
        return this.workOrdersService.addComment(id, commentData.content, commentData.authorId, commentData.isInternal || false);
    }
    async seedSampleWorkOrders() {
        return this.workOrdersService.seedSampleWorkOrders();
    }
};
exports.WorkOrdersController = WorkOrdersController;
__decorate([
    (0, common_1.Get)(),
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
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('assignedTo')),
    __param(2, (0, common_1.Query)('priority')),
    __param(3, (0, common_1.Query)('type')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, common_1.Query)('dateFrom')),
    __param(6, (0, common_1.Query)('dateTo')),
    __param(7, (0, common_1.Query)('overdueOnly')),
    __param(8, (0, common_1.Query)('limit')),
    __param(9, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, Boolean, Number, Number]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get work order by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Work order retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Work order not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new work order' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Work order created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update work order' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Work order updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Work order not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update work order status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Work order status updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete work order' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Work order deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Work order not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('stats/dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard stats retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('overdue/list'),
    (0, swagger_1.ApiOperation)({ summary: 'Get overdue work orders' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Overdue work orders retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "getOverdueWorkOrders", null);
__decorate([
    (0, common_1.Post)(':id/comments'),
    (0, swagger_1.ApiOperation)({ summary: 'Add comment to work order' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Comment added successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Work order not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "addComment", null);
__decorate([
    (0, common_1.Post)('seed/sample-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Seed sample work orders for development' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Sample work orders created successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorkOrdersController.prototype, "seedSampleWorkOrders", null);
exports.WorkOrdersController = WorkOrdersController = __decorate([
    (0, swagger_1.ApiTags)('Work Orders'),
    (0, common_1.Controller)('work-orders'),
    (0, common_1.UseGuards)(dev_auth_guard_1.DevAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [work_orders_service_1.WorkOrdersService])
], WorkOrdersController);
//# sourceMappingURL=work-orders.controller.js.map