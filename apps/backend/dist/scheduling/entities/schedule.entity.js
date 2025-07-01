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
exports.Schedule = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
let Schedule = class Schedule {
    get utilizationPercentage() {
        if (this.availableHours === 0)
            return 0;
        return Math.round((this.scheduledHours / this.availableHours) * 100);
    }
    get remainingHours() {
        return Math.max(0, this.availableHours - this.scheduledHours);
    }
    get isOverallocated() {
        return this.scheduledHours > this.availableHours;
    }
    get utilizationStatus() {
        const utilization = this.utilizationPercentage;
        if (utilization < 80)
            return 'under';
        if (utilization > 100)
            return 'over';
        return 'optimal';
    }
};
exports.Schedule = Schedule;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Schedule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Schedule.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 4,
        scale: 2,
        default: 8.00,
        comment: 'Available hours for the technician on this date (default 8 hours)'
    }),
    __metadata("design:type", Number)
], Schedule.prototype, "availableHours", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 4,
        scale: 2,
        default: 0.00,
        comment: 'Hours currently scheduled for work orders on this date'
    }),
    __metadata("design:type", Number)
], Schedule.prototype, "scheduledHours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Schedule.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: true,
        comment: 'Whether the technician is available for work on this date'
    }),
    __metadata("design:type", Boolean)
], Schedule.prototype, "isAvailable", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Schedule.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Schedule.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.schedules, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'technician_id' }),
    __metadata("design:type", user_entity_1.User)
], Schedule.prototype, "technician", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'technician_id' }),
    __metadata("design:type", String)
], Schedule.prototype, "technicianId", void 0);
exports.Schedule = Schedule = __decorate([
    (0, typeorm_1.Entity)('schedules'),
    (0, typeorm_1.Index)(['technicianId', 'date'], { unique: true })
], Schedule);
//# sourceMappingURL=schedule.entity.js.map