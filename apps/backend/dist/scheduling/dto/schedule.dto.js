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
exports.UtilizationStatsDto = exports.ScheduleResponseDto = exports.ScheduleQueryDto = exports.UpdateScheduleDto = exports.CreateScheduleDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class CreateScheduleDto {
}
exports.CreateScheduleDto = CreateScheduleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID of the technician to schedule' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateScheduleDto.prototype, "technicianId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date for the schedule (YYYY-MM-DD format)' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsDateString)(),
    (0, class_transformer_1.Transform)(({ value }) => new Date(value)),
    __metadata("design:type", Date)
], CreateScheduleDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Available hours for the technician (default: 8.0)', default: 8.0, minimum: 0, maximum: 24 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(24),
    __metadata("design:type", Number)
], CreateScheduleDto.prototype, "availableHours", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Currently scheduled hours (default: 0.0)', default: 0.0, minimum: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateScheduleDto.prototype, "scheduledHours", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Notes about the schedule' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateScheduleDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Whether the technician is available (default: true)', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateScheduleDto.prototype, "isAvailable", void 0);
class UpdateScheduleDto extends (0, swagger_1.PartialType)(CreateScheduleDto) {
}
exports.UpdateScheduleDto = UpdateScheduleDto;
class ScheduleQueryDto {
}
exports.ScheduleQueryDto = ScheduleQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by technician ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScheduleQueryDto.prototype, "technicianId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter schedules from this date onwards (YYYY-MM-DD)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScheduleQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter schedules up to this date (YYYY-MM-DD)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScheduleQueryDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by availability status' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === 'true')
            return true;
        if (value === 'false')
            return false;
        return value;
    }),
    __metadata("design:type", Boolean)
], ScheduleQueryDto.prototype, "isAvailable", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by utilization status',
        enum: ['under', 'optimal', 'over'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScheduleQueryDto.prototype, "utilizationStatus", void 0);
class ScheduleResponseDto {
}
exports.ScheduleResponseDto = ScheduleResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ScheduleResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], ScheduleResponseDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ScheduleResponseDto.prototype, "availableHours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ScheduleResponseDto.prototype, "scheduledHours", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], ScheduleResponseDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ScheduleResponseDto.prototype, "isAvailable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], ScheduleResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], ScheduleResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ScheduleResponseDto.prototype, "technicianId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ScheduleResponseDto.prototype, "technician", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Calculated utilization percentage' }),
    __metadata("design:type", Number)
], ScheduleResponseDto.prototype, "utilizationPercentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Remaining available hours' }),
    __metadata("design:type", Number)
], ScheduleResponseDto.prototype, "remainingHours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the technician is over-allocated' }),
    __metadata("design:type", Boolean)
], ScheduleResponseDto.prototype, "isOverallocated", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Utilization status category' }),
    __metadata("design:type", String)
], ScheduleResponseDto.prototype, "utilizationStatus", void 0);
class UtilizationStatsDto {
}
exports.UtilizationStatsDto = UtilizationStatsDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UtilizationStatsDto.prototype, "totalSchedules", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UtilizationStatsDto.prototype, "totalAvailableHours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UtilizationStatsDto.prototype, "totalScheduledHours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UtilizationStatsDto.prototype, "averageUtilization", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UtilizationStatsDto.prototype, "overallocatedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UtilizationStatsDto.prototype, "underutilizedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UtilizationStatsDto.prototype, "optimalCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ScheduleResponseDto] }),
    __metadata("design:type", Array)
], UtilizationStatsDto.prototype, "schedules", void 0);
//# sourceMappingURL=schedule.dto.js.map