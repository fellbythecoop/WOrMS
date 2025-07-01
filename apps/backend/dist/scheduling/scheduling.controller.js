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
var SchedulingController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const scheduling_service_1 = require("./scheduling.service");
const schedule_dto_1 = require("./dto/schedule.dto");
const dev_auth_guard_1 = require("../auth/guards/dev-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const require_permissions_decorator_1 = require("../auth/decorators/require-permissions.decorator");
const permissions_enum_1 = require("../auth/permissions/permissions.enum");
let SchedulingController = SchedulingController_1 = class SchedulingController {
    constructor(schedulingService) {
        this.schedulingService = schedulingService;
        this.logger = new common_1.Logger(SchedulingController_1.name);
    }
    async create(createScheduleDto) {
        this.logger.log(`Creating schedule for technician ${createScheduleDto.technicianId} on ${createScheduleDto.date}`);
        return await this.schedulingService.create(createScheduleDto);
    }
    async findAll(query) {
        this.logger.log(`Fetching schedules with query: ${JSON.stringify(query)}`);
        return await this.schedulingService.findAll(query);
    }
    async getUtilizationStats(technicianId, startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.schedulingService.getUtilizationStats(technicianId, start, end);
    }
    async findByTechnicianAndDateRange(technicianId, startDate, endDate) {
        this.logger.log(`Fetching schedules for technician ${technicianId} from ${startDate} to ${endDate}`);
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        return await this.schedulingService.findByTechnicianAndDateRange(technicianId, startDateObj, endDateObj);
    }
    async findOne(id) {
        this.logger.log(`Fetching schedule ${id}`);
        return await this.schedulingService.findOne(id);
    }
    async update(id, updateScheduleDto) {
        this.logger.log(`Updating schedule ${id}`);
        return await this.schedulingService.update(id, updateScheduleDto);
    }
    async remove(id) {
        this.logger.log(`Deleting schedule ${id}`);
        await this.schedulingService.remove(id);
    }
    async setScheduledHours(id, body) {
        this.logger.log(`Setting scheduled hours for schedule ${id}: ${body.totalHours} hours`);
        const schedule = await this.schedulingService.findOne(id);
        return await this.schedulingService.setScheduledHours(schedule.technicianId, schedule.date, body.totalHours);
    }
    async setTechnicianScheduledHours(technicianId, body) {
        this.logger.log(`Setting scheduled hours for technician ${technicianId} on ${body.date}: ${body.totalHours} hours`);
        const date = new Date(body.date);
        return await this.schedulingService.setScheduledHours(technicianId, date, body.totalHours);
    }
    async seedSampleSchedules() {
        return this.schedulingService.seedSampleSchedules();
    }
};
exports.SchedulingController = SchedulingController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MANAGE_SCHEDULES),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new technician schedule' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Schedule created successfully', type: schedule_dto_1.ScheduleResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Schedule already exists for this technician on this date' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [schedule_dto_1.CreateScheduleDto]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.VIEW_SCHEDULES),
    (0, swagger_1.ApiOperation)({ summary: 'Get all schedules with optional filtering' }),
    (0, swagger_1.ApiQuery)({ name: 'technicianId', required: false, description: 'Filter by technician ID' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Filter from date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'Filter to date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'isAvailable', required: false, description: 'Filter by availability' }),
    (0, swagger_1.ApiQuery)({ name: 'utilizationStatus', required: false, enum: ['under', 'optimal', 'over'], description: 'Filter by utilization status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Schedules retrieved successfully', type: [schedule_dto_1.ScheduleResponseDto] }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [schedule_dto_1.ScheduleQueryDto]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('utilization/stats'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.VIEW_WORK_ORDERS),
    (0, swagger_1.ApiOperation)({ summary: 'Get utilization statistics' }),
    (0, swagger_1.ApiQuery)({ name: 'technicianId', required: false, description: 'Filter by technician ID' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Utilization statistics retrieved successfully', type: schedule_dto_1.UtilizationStatsDto }),
    __param(0, (0, common_1.Query)('technicianId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "getUtilizationStats", null);
__decorate([
    (0, common_1.Get)('technician/:technicianId'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.VIEW_SCHEDULES),
    (0, swagger_1.ApiOperation)({ summary: 'Get schedules for a specific technician within a date range' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Technician schedules retrieved successfully', type: [schedule_dto_1.ScheduleResponseDto] }),
    __param(0, (0, common_1.Param)('technicianId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "findByTechnicianAndDateRange", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.VIEW_SCHEDULES),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific schedule by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Schedule retrieved successfully', type: schedule_dto_1.ScheduleResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Schedule not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MANAGE_SCHEDULES),
    (0, swagger_1.ApiOperation)({ summary: 'Update a schedule' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Schedule updated successfully', type: schedule_dto_1.ScheduleResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Schedule not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Schedule conflict detected' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, schedule_dto_1.UpdateScheduleDto]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MANAGE_SCHEDULES),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a schedule' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Schedule deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Schedule not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/scheduled-hours'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MANAGE_SCHEDULES),
    (0, swagger_1.ApiOperation)({ summary: 'Set scheduled hours for a schedule' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Scheduled hours set successfully', type: schedule_dto_1.ScheduleResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "setScheduledHours", null);
__decorate([
    (0, common_1.Post)('technician/:technicianId/scheduled-hours'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MANAGE_SCHEDULES),
    (0, swagger_1.ApiOperation)({ summary: 'Set scheduled hours for a technician on a specific date' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Scheduled hours set successfully', type: schedule_dto_1.ScheduleResponseDto }),
    __param(0, (0, common_1.Param)('technicianId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "setTechnicianScheduledHours", null);
__decorate([
    (0, common_1.Post)('seed'),
    (0, swagger_1.ApiOperation)({ summary: 'Seed sample schedules (development only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Sample schedules created successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "seedSampleSchedules", null);
exports.SchedulingController = SchedulingController = SchedulingController_1 = __decorate([
    (0, swagger_1.ApiTags)('Scheduling'),
    (0, common_1.Controller)('scheduling'),
    (0, common_1.UseGuards)(dev_auth_guard_1.DevAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [scheduling_service_1.SchedulingService])
], SchedulingController);
//# sourceMappingURL=scheduling.controller.js.map