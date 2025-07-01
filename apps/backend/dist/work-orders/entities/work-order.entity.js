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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkOrder = exports.WorkOrderType = exports.WorkOrderPriority = exports.WorkOrderStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const asset_entity_1 = require("../../assets/entities/asset.entity");
const customer_entity_1 = require("../../customers/entities/customer.entity");
const work_order_comment_entity_1 = require("./work-order-comment.entity");
const work_order_attachment_entity_1 = require("./work-order-attachment.entity");
const work_order_time_entry_entity_1 = require("./work-order-time-entry.entity");
var WorkOrderStatus;
(function (WorkOrderStatus) {
    WorkOrderStatus["OPEN"] = "open";
    WorkOrderStatus["IN_PROGRESS"] = "in_progress";
    WorkOrderStatus["PENDING"] = "pending";
    WorkOrderStatus["COMPLETED"] = "completed";
    WorkOrderStatus["CANCELLED"] = "cancelled";
    WorkOrderStatus["CLOSED"] = "closed";
})(WorkOrderStatus || (exports.WorkOrderStatus = WorkOrderStatus = {}));
var WorkOrderPriority;
(function (WorkOrderPriority) {
    WorkOrderPriority["LOW"] = "low";
    WorkOrderPriority["MEDIUM"] = "medium";
    WorkOrderPriority["HIGH"] = "high";
    WorkOrderPriority["CRITICAL"] = "critical";
})(WorkOrderPriority || (exports.WorkOrderPriority = WorkOrderPriority = {}));
var WorkOrderType;
(function (WorkOrderType) {
    WorkOrderType["MAINTENANCE"] = "maintenance";
    WorkOrderType["REPAIR"] = "repair";
    WorkOrderType["INSPECTION"] = "inspection";
    WorkOrderType["INSTALLATION"] = "installation";
    WorkOrderType["EMERGENCY"] = "emergency";
})(WorkOrderType || (exports.WorkOrderType = WorkOrderType = {}));
let WorkOrder = class WorkOrder {
    get isOverdue() {
        if (!this.scheduledEndDate)
            return false;
        return new Date() > this.scheduledEndDate &&
            ![WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED, WorkOrderStatus.CLOSED].includes(this.status);
    }
    get daysOverdue() {
        if (!this.isOverdue)
            return 0;
        const today = new Date();
        const scheduledEnd = new Date(this.scheduledEndDate);
        return Math.floor((today.getTime() - scheduledEnd.getTime()) / (1000 * 3600 * 24));
    }
    get duration() {
        if (!this.actualStartDate || !this.actualEndDate)
            return null;
        return Math.floor((this.actualEndDate.getTime() - this.actualStartDate.getTime()) / (1000 * 3600 * 24));
    }
    get totalTimeEntries() {
        return this.timeEntries?.reduce((total, entry) => total + Number(entry.hours), 0) || 0;
    }
    get totalTimeCost() {
        return this.timeEntries?.reduce((total, entry) => total + Number(entry.totalAmount), 0) || 0;
    }
    get assignedUsers() {
        if (!this.assignedUserIds)
            return [];
        try {
            return JSON.parse(this.assignedUserIds);
        }
        catch {
            return [];
        }
    }
    set assignedUsers(userIds) {
        this.assignedUserIds = JSON.stringify(userIds);
    }
    get workOrderTags() {
        if (!this.tags)
            return [];
        try {
            return JSON.parse(this.tags);
        }
        catch {
            return [];
        }
    }
    set workOrderTags(tagList) {
        this.tags = JSON.stringify(tagList);
    }
};
exports.WorkOrder = WorkOrder;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WorkOrder.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "workOrderNumber", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WorkOrder.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], WorkOrder.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: WorkOrderStatus.OPEN,
    }),
    __metadata("design:type", String)
], WorkOrder.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: WorkOrderPriority.MEDIUM,
    }),
    __metadata("design:type", String)
], WorkOrder.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: WorkOrderType.MAINTENANCE,
    }),
    __metadata("design:type", String)
], WorkOrder.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], WorkOrder.prototype, "estimatedHours", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], WorkOrder.prototype, "actualHours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', nullable: true }),
    __metadata("design:type", Number)
], WorkOrder.prototype, "estimatedCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', nullable: true }),
    __metadata("design:type", Number)
], WorkOrder.prototype, "actualCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], WorkOrder.prototype, "scheduledStartDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], WorkOrder.prototype, "scheduledEndDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], WorkOrder.prototype, "actualStartDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], WorkOrder.prototype, "actualEndDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "completionNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        default: 'not_ready',
        enum: ['not_ready', 'in_progress', 'ready', 'completed']
    }),
    __metadata("design:type", String)
], WorkOrder.prototype, "billingStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "signature", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WorkOrder.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], WorkOrder.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.assignedWorkOrders, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_to_id' }),
    __metadata("design:type", user_entity_1.User)
], WorkOrder.prototype, "assignedTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_to_id', nullable: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "assignedToId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "assignedUserIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => asset_entity_1.Asset, asset => asset.workOrders, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'asset_id' }),
    __metadata("design:type", asset_entity_1.Asset)
], WorkOrder.prototype, "asset", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'asset_id', nullable: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "assetId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_entity_1.Customer, customer => customer.workOrders, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id' }),
    __metadata("design:type", customer_entity_1.Customer)
], WorkOrder.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'customer_id', nullable: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => work_order_comment_entity_1.WorkOrderComment, comment => comment.workOrder),
    __metadata("design:type", Array)
], WorkOrder.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => work_order_attachment_entity_1.WorkOrderAttachment, attachment => attachment.workOrder),
    __metadata("design:type", Array)
], WorkOrder.prototype, "attachments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => work_order_time_entry_entity_1.WorkOrderTimeEntry, timeEntry => timeEntry.workOrder),
    __metadata("design:type", Array)
], WorkOrder.prototype, "timeEntries", void 0);
exports.WorkOrder = WorkOrder = __decorate([
    (0, typeorm_1.Entity)('work_orders'),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['priority']),
    (0, typeorm_1.Index)(['assignedToId']),
    (0, typeorm_1.Index)(['scheduledStartDate']),
    (0, typeorm_1.Index)(['createdAt']),
    (0, typeorm_1.Index)(['status', 'assignedToId']),
    (0, typeorm_1.Index)(['scheduledStartDate', 'assignedToId']),
    (0, typeorm_1.Index)(['workOrderNumber'])
], WorkOrder);
//# sourceMappingURL=work-order.entity.js.map