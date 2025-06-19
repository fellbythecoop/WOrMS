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
exports.WorkOrderTimeEntry = exports.TimeEntryType = void 0;
const typeorm_1 = require("typeorm");
const work_order_entity_1 = require("./work-order.entity");
const user_entity_1 = require("../../users/entities/user.entity");
var TimeEntryType;
(function (TimeEntryType) {
    TimeEntryType["TRAVEL_TIME"] = "travel_time";
    TimeEntryType["STRAIGHT_TIME"] = "straight_time";
    TimeEntryType["OVERTIME"] = "overtime";
    TimeEntryType["DOUBLE_TIME"] = "double_time";
})(TimeEntryType || (exports.TimeEntryType = TimeEntryType = {}));
let WorkOrderTimeEntry = class WorkOrderTimeEntry {
};
exports.WorkOrderTimeEntry = WorkOrderTimeEntry;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WorkOrderTimeEntry.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
    }),
    __metadata("design:type", String)
], WorkOrderTimeEntry.prototype, "timeEntryType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], WorkOrderTimeEntry.prototype, "hours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], WorkOrderTimeEntry.prototype, "rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], WorkOrderTimeEntry.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], WorkOrderTimeEntry.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime' }),
    __metadata("design:type", Date)
], WorkOrderTimeEntry.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WorkOrderTimeEntry.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], WorkOrderTimeEntry.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => work_order_entity_1.WorkOrder, workOrder => workOrder.timeEntries, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'work_order_id' }),
    __metadata("design:type", work_order_entity_1.WorkOrder)
], WorkOrderTimeEntry.prototype, "workOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'work_order_id' }),
    __metadata("design:type", String)
], WorkOrderTimeEntry.prototype, "workOrderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.timeEntries),
    (0, typeorm_1.JoinColumn)({ name: 'technician_id' }),
    __metadata("design:type", user_entity_1.User)
], WorkOrderTimeEntry.prototype, "technician", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'technician_id' }),
    __metadata("design:type", String)
], WorkOrderTimeEntry.prototype, "technicianId", void 0);
exports.WorkOrderTimeEntry = WorkOrderTimeEntry = __decorate([
    (0, typeorm_1.Entity)('work_order_time_entries')
], WorkOrderTimeEntry);
//# sourceMappingURL=work-order-time-entry.entity.js.map