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
var SchedulingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_entity_1 = require("./entities/schedule.entity");
const user_entity_1 = require("../users/entities/user.entity");
const work_orders_gateway_1 = require("../websocket/work-orders.gateway");
let SchedulingService = SchedulingService_1 = class SchedulingService {
    constructor(scheduleRepository, userRepository, workOrdersGateway) {
        this.scheduleRepository = scheduleRepository;
        this.userRepository = userRepository;
        this.workOrdersGateway = workOrdersGateway;
        this.logger = new common_1.Logger(SchedulingService_1.name);
    }
    async create(createScheduleDto) {
        try {
            const technician = await this.validateTechnician(createScheduleDto.technicianId);
            const existingSchedule = await this.scheduleRepository.findOne({
                where: {
                    technicianId: createScheduleDto.technicianId,
                    date: createScheduleDto.date,
                },
            });
            if (existingSchedule) {
                throw new common_1.ConflictException(`Schedule already exists for technician ${technician.fullName} on ${createScheduleDto.date}`);
            }
            const schedule = this.scheduleRepository.create({
                ...createScheduleDto,
                availableHours: createScheduleDto.availableHours || 8.0,
            });
            const savedSchedule = await this.scheduleRepository.save(schedule);
            this.logger.log(`Created schedule ${savedSchedule.id} for technician ${technician.fullName} on ${createScheduleDto.date}`);
            return this.findOne(savedSchedule.id);
        }
        catch (error) {
            this.logger.error(`Failed to create schedule: ${error.message}`, error.stack);
            throw error;
        }
    }
    async findAll(query = {}) {
        try {
            const queryBuilder = this.scheduleRepository
                .createQueryBuilder('schedule')
                .leftJoinAndSelect('schedule.technician', 'technician')
                .orderBy('schedule.date', 'ASC')
                .addOrderBy('technician.firstName', 'ASC');
            if (query.technicianId) {
                queryBuilder.andWhere('schedule.technicianId = :technicianId', {
                    technicianId: query.technicianId
                });
            }
            if (query.startDate && query.endDate) {
                const startDate = new Date(query.startDate);
                const endDate = new Date(query.endDate);
                queryBuilder.andWhere('schedule.date BETWEEN :startDate AND :endDate', {
                    startDate,
                    endDate,
                });
            }
            else if (query.startDate) {
                const startDate = new Date(query.startDate);
                queryBuilder.andWhere('schedule.date >= :startDate', { startDate });
            }
            else if (query.endDate) {
                const endDate = new Date(query.endDate);
                queryBuilder.andWhere('schedule.date <= :endDate', { endDate });
            }
            if (query.isAvailable !== undefined) {
                queryBuilder.andWhere('schedule.isAvailable = :isAvailable', {
                    isAvailable: query.isAvailable
                });
            }
            if (query.utilizationStatus) {
                switch (query.utilizationStatus) {
                    case 'under':
                        queryBuilder.andWhere('(schedule.scheduledHours / schedule.availableHours) < 0.8');
                        break;
                    case 'optimal':
                        queryBuilder.andWhere('(schedule.scheduledHours / schedule.availableHours) BETWEEN 0.8 AND 1.0');
                        break;
                    case 'over':
                        queryBuilder.andWhere('(schedule.scheduledHours / schedule.availableHours) > 1.0');
                        break;
                }
            }
            return await queryBuilder.getMany();
        }
        catch (error) {
            this.logger.error(`Failed to fetch schedules: ${error.message}`, error.stack);
            throw error;
        }
    }
    async findOne(id) {
        try {
            const schedule = await this.scheduleRepository.findOne({
                where: { id },
                relations: ['technician'],
            });
            if (!schedule) {
                throw new common_1.NotFoundException(`Schedule with ID ${id} not found`);
            }
            return schedule;
        }
        catch (error) {
            this.logger.error(`Failed to fetch schedule ${id}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async update(id, updateScheduleDto) {
        try {
            const schedule = await this.findOne(id);
            if (updateScheduleDto.technicianId && updateScheduleDto.technicianId !== schedule.technicianId) {
                await this.validateTechnician(updateScheduleDto.technicianId);
            }
            if ((updateScheduleDto.date && updateScheduleDto.date !== schedule.date) ||
                (updateScheduleDto.technicianId && updateScheduleDto.technicianId !== schedule.technicianId)) {
                const conflictingSchedule = await this.scheduleRepository.findOne({
                    where: {
                        technicianId: updateScheduleDto.technicianId || schedule.technicianId,
                        date: updateScheduleDto.date || schedule.date,
                        id: (0, typeorm_2.Not)(id),
                    },
                });
                if (conflictingSchedule) {
                    throw new common_1.ConflictException('Schedule conflict detected');
                }
            }
            await this.scheduleRepository.update(id, updateScheduleDto);
            this.logger.log(`Updated schedule ${id}`);
            return this.findOne(id);
        }
        catch (error) {
            this.logger.error(`Failed to update schedule ${id}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async remove(id) {
        try {
            const schedule = await this.findOne(id);
            await this.scheduleRepository.remove(schedule);
            this.logger.log(`Deleted schedule ${id}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete schedule ${id}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async findByTechnicianAndDateRange(technicianId, startDate, endDate) {
        try {
            return await this.scheduleRepository.find({
                where: {
                    technicianId,
                    date: (0, typeorm_2.Between)(startDate, endDate),
                },
                relations: ['technician'],
                order: { date: 'ASC' },
            });
        }
        catch (error) {
            this.logger.error(`Failed to fetch schedules for technician ${technicianId}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async setScheduledHours(technicianId, date, totalHours) {
        const dateString = date.toISOString().split('T')[0];
        try {
            await this.scheduleRepository.manager.query(`
        INSERT OR REPLACE INTO schedules (
          id, 
          technician_id, 
          date, 
          available_hours, 
          scheduled_hours, 
          is_available, 
          created_at, 
          updated_at,
          notes
        ) 
        VALUES (
          COALESCE((SELECT id FROM schedules WHERE technician_id = ? AND date = ?), ?),
          ?, 
          ?, 
          8.0, 
          ?, 
          1, 
          COALESCE((SELECT created_at FROM schedules WHERE technician_id = ? AND date = ?), datetime('now')),
          datetime('now'),
          NULL
        )
      `, [
                technicianId, date, this.generateUUID(),
                technicianId,
                date,
                Math.max(0, totalHours),
                technicianId, date
            ]);
            const schedule = await this.scheduleRepository.findOne({
                where: { technicianId, date },
                relations: ['technician'],
            });
            if (!schedule) {
                throw new Error(`Failed to retrieve schedule after upsert for technician ${technicianId} on ${dateString}`);
            }
            this.logger.log(`Set scheduled hours for technician ${technicianId} on ${dateString}: ${totalHours} hours`);
            return schedule;
        }
        catch (error) {
            this.logger.error(`Failed to set scheduled hours: ${error.message}`, error.stack);
            throw error;
        }
    }
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    async getUtilizationStats(technicianId, startDate, endDate) {
        try {
            const queryBuilder = this.scheduleRepository
                .createQueryBuilder('schedule')
                .leftJoinAndSelect('schedule.technician', 'technician');
            if (technicianId) {
                queryBuilder.andWhere('schedule.technicianId = :technicianId', { technicianId });
            }
            if (startDate && endDate) {
                queryBuilder.andWhere('schedule.date BETWEEN :startDate AND :endDate', {
                    startDate,
                    endDate,
                });
            }
            const schedules = await queryBuilder.getMany();
            const totalAvailableHours = schedules.reduce((sum, s) => sum + Number(s.availableHours), 0);
            const totalScheduledHours = schedules.reduce((sum, s) => sum + Number(s.scheduledHours), 0);
            const overallocatedCount = schedules.filter(s => s.isOverallocated).length;
            const underutilizedCount = schedules.filter(s => s.utilizationStatus === 'under').length;
            const optimalCount = schedules.filter(s => s.utilizationStatus === 'optimal').length;
            return {
                totalSchedules: schedules.length,
                totalAvailableHours,
                totalScheduledHours,
                averageUtilization: totalAvailableHours > 0 ? Math.round((totalScheduledHours / totalAvailableHours) * 100) : 0,
                overallocatedCount,
                underutilizedCount,
                optimalCount,
                schedules,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get utilization stats: ${error.message}`, error.stack);
            throw error;
        }
    }
    async validateTechnician(technicianId) {
        const technician = await this.userRepository.findOne({
            where: { id: technicianId },
        });
        if (!technician) {
            throw new common_1.NotFoundException(`Technician with ID ${technicianId} not found`);
        }
        if (technician.role !== user_entity_1.UserRole.TECHNICIAN && technician.role !== user_entity_1.UserRole.ADMINISTRATOR) {
            throw new common_1.BadRequestException(`User ${technician.fullName} is not a technician or administrator`);
        }
        return technician;
    }
    async seedSampleSchedules() {
        try {
            const existingSchedules = await this.scheduleRepository.count();
            if (existingSchedules > 0) {
                this.logger.log('Sample schedules already exist, returning existing schedules');
                return this.findAll();
            }
            const technicians = await this.userRepository.find({
                where: [
                    { role: user_entity_1.UserRole.TECHNICIAN },
                    { role: user_entity_1.UserRole.ADMINISTRATOR }
                ]
            });
            if (technicians.length === 0) {
                throw new Error('Please seed users first by calling POST /api/users/seed');
            }
            const sampleSchedules = [];
            const today = new Date();
            for (const technician of technicians) {
                for (let dayOffset = -7; dayOffset <= 30; dayOffset++) {
                    const scheduleDate = new Date(today);
                    scheduleDate.setDate(today.getDate() + dayOffset);
                    const dayOfWeek = scheduleDate.getDay();
                    if (dayOfWeek === 0 || dayOfWeek === 6) {
                        continue;
                    }
                    const scheduledHours = Math.random() > 0.3 ? Math.floor(Math.random() * 6) + 2 : 0;
                    const availableHours = 8.0;
                    sampleSchedules.push({
                        technicianId: technician.id,
                        date: scheduleDate,
                        availableHours,
                        scheduledHours,
                        isAvailable: Math.random() > 0.1,
                        notes: scheduledHours > 6 ? 'Heavy workload day' : scheduledHours === 0 ? 'Available for assignments' : undefined,
                    });
                }
            }
            const createdSchedules = [];
            for (const scheduleData of sampleSchedules) {
                try {
                    const schedule = this.scheduleRepository.create(scheduleData);
                    const savedSchedule = await this.scheduleRepository.save(schedule);
                    createdSchedules.push(savedSchedule);
                }
                catch (error) {
                    this.logger.warn(`Skipped schedule creation: ${error.message}`);
                }
            }
            this.logger.log(`Created ${createdSchedules.length} sample schedules`);
            return this.findAll();
        }
        catch (error) {
            this.logger.error(`Failed to seed sample schedules: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.SchedulingService = SchedulingService;
exports.SchedulingService = SchedulingService = SchedulingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(schedule_entity_1.Schedule)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => work_orders_gateway_1.WorkOrdersGateway))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        work_orders_gateway_1.WorkOrdersGateway])
], SchedulingService);
//# sourceMappingURL=scheduling.service.js.map