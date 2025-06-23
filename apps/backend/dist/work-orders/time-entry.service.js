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
exports.TimeEntryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const work_order_time_entry_entity_1 = require("./entities/work-order-time-entry.entity");
const work_order_entity_1 = require("./entities/work-order.entity");
const customer_entity_1 = require("../customers/entities/customer.entity");
const user_entity_1 = require("../users/entities/user.entity");
let TimeEntryService = class TimeEntryService {
    constructor(timeEntryRepository, workOrderRepository, customerRepository, userRepository) {
        this.timeEntryRepository = timeEntryRepository;
        this.workOrderRepository = workOrderRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
    }
    async createTimeEntry(createTimeEntryDto) {
        const { workOrderId, technicianId, timeEntryType, hours, description, date } = createTimeEntryDto;
        const workOrder = await this.workOrderRepository.findOne({
            where: { id: workOrderId },
            relations: ['customer'],
        });
        if (!workOrder) {
            throw new common_1.NotFoundException('Work order not found');
        }
        const technician = await this.userRepository.findOne({
            where: { id: technicianId },
        });
        if (!technician) {
            throw new common_1.NotFoundException('Technician not found');
        }
        if (hours <= 0 || hours > 24) {
            throw new common_1.BadRequestException('Hours must be between 0 and 24');
        }
        const customer = workOrder.customer;
        let rate = 0;
        if (customer) {
            switch (timeEntryType) {
                case work_order_time_entry_entity_1.TimeEntryType.TRAVEL_TIME:
                    rate = Number(customer.travelTimeRate);
                    break;
                case work_order_time_entry_entity_1.TimeEntryType.STRAIGHT_TIME:
                    rate = Number(customer.straightTimeRate);
                    break;
                case work_order_time_entry_entity_1.TimeEntryType.OVERTIME:
                    rate = Number(customer.overtimeRate);
                    break;
                case work_order_time_entry_entity_1.TimeEntryType.DOUBLE_TIME:
                    rate = Number(customer.doubleTimeRate);
                    break;
                default:
                    throw new common_1.BadRequestException('Invalid time entry type');
            }
        }
        else {
            switch (timeEntryType) {
                case work_order_time_entry_entity_1.TimeEntryType.TRAVEL_TIME:
                    rate = 25.00;
                    break;
                case work_order_time_entry_entity_1.TimeEntryType.STRAIGHT_TIME:
                    rate = 50.00;
                    break;
                case work_order_time_entry_entity_1.TimeEntryType.OVERTIME:
                    rate = 75.00;
                    break;
                case work_order_time_entry_entity_1.TimeEntryType.DOUBLE_TIME:
                    rate = 100.00;
                    break;
                default:
                    throw new common_1.BadRequestException('Invalid time entry type');
            }
        }
        if (rate <= 0) {
            throw new common_1.BadRequestException(`Rate not configured for ${timeEntryType}`);
        }
        const totalAmount = hours * rate;
        const timeEntry = this.timeEntryRepository.create({
            workOrderId,
            technicianId,
            timeEntryType,
            hours,
            rate,
            totalAmount,
            description,
            report: createTimeEntryDto.report,
            workCompleted: createTimeEntryDto.workCompleted || false,
            date,
        });
        const savedTimeEntry = await this.timeEntryRepository.save(timeEntry);
        await this.updateWorkOrderTotals(workOrderId);
        if (createTimeEntryDto.workCompleted) {
            await this.updateWorkOrderStatusOnCompletion(workOrderId);
        }
        return this.timeEntryRepository.findOne({
            where: { id: savedTimeEntry.id },
            relations: ['technician'],
        });
    }
    async updateTimeEntry(id, updateTimeEntryDto) {
        const timeEntry = await this.timeEntryRepository.findOne({
            where: { id },
            relations: ['workOrder', 'workOrder.customer'],
        });
        if (!timeEntry) {
            throw new common_1.NotFoundException('Time entry not found');
        }
        if (updateTimeEntryDto.hours !== undefined || updateTimeEntryDto.timeEntryType !== undefined) {
            const hours = updateTimeEntryDto.hours ?? timeEntry.hours;
            const timeEntryType = updateTimeEntryDto.timeEntryType ?? timeEntry.timeEntryType;
            if (hours <= 0 || hours > 24) {
                throw new common_1.BadRequestException('Hours must be between 0 and 24');
            }
            const customer = timeEntry.workOrder.customer;
            let rate = 0;
            if (customer) {
                switch (timeEntryType) {
                    case work_order_time_entry_entity_1.TimeEntryType.TRAVEL_TIME:
                        rate = Number(customer.travelTimeRate);
                        break;
                    case work_order_time_entry_entity_1.TimeEntryType.STRAIGHT_TIME:
                        rate = Number(customer.straightTimeRate);
                        break;
                    case work_order_time_entry_entity_1.TimeEntryType.OVERTIME:
                        rate = Number(customer.overtimeRate);
                        break;
                    case work_order_time_entry_entity_1.TimeEntryType.DOUBLE_TIME:
                        rate = Number(customer.doubleTimeRate);
                        break;
                    default:
                        throw new common_1.BadRequestException('Invalid time entry type');
                }
            }
            else {
                switch (timeEntryType) {
                    case work_order_time_entry_entity_1.TimeEntryType.TRAVEL_TIME:
                        rate = 25.00;
                        break;
                    case work_order_time_entry_entity_1.TimeEntryType.STRAIGHT_TIME:
                        rate = 50.00;
                        break;
                    case work_order_time_entry_entity_1.TimeEntryType.OVERTIME:
                        rate = 75.00;
                        break;
                    case work_order_time_entry_entity_1.TimeEntryType.DOUBLE_TIME:
                        rate = 100.00;
                        break;
                    default:
                        throw new common_1.BadRequestException('Invalid time entry type');
                }
            }
            if (rate <= 0) {
                throw new common_1.BadRequestException(`Rate not configured for ${timeEntryType}`);
            }
            Object.assign(timeEntry, {
                ...updateTimeEntryDto,
                rate,
                totalAmount: hours * rate,
            });
        }
        else {
            Object.assign(timeEntry, updateTimeEntryDto);
        }
        const savedTimeEntry = await this.timeEntryRepository.save(timeEntry);
        await this.updateWorkOrderTotals(timeEntry.workOrderId);
        if (updateTimeEntryDto.workCompleted) {
            await this.updateWorkOrderStatusOnCompletion(timeEntry.workOrderId);
        }
        return savedTimeEntry;
    }
    async deleteTimeEntry(id) {
        const timeEntry = await this.timeEntryRepository.findOne({
            where: { id },
        });
        if (!timeEntry) {
            throw new common_1.NotFoundException('Time entry not found');
        }
        await this.timeEntryRepository.remove(timeEntry);
        await this.updateWorkOrderTotals(timeEntry.workOrderId);
    }
    async getTimeEntriesByWorkOrder(workOrderId) {
        return this.timeEntryRepository.find({
            where: { workOrderId },
            relations: ['technician'],
            order: { date: 'DESC', createdAt: 'DESC' },
        });
    }
    async getTimeEntryById(id) {
        const timeEntry = await this.timeEntryRepository.findOne({
            where: { id },
            relations: ['workOrder', 'technician'],
        });
        if (!timeEntry) {
            throw new common_1.NotFoundException('Time entry not found');
        }
        return timeEntry;
    }
    async updateWorkOrderTotals(workOrderId) {
        const timeEntries = await this.timeEntryRepository.find({
            where: { workOrderId },
        });
        const totalHours = timeEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);
        const totalCost = timeEntries.reduce((sum, entry) => sum + Number(entry.totalAmount), 0);
        await this.workOrderRepository.update(workOrderId, {
            actualHours: totalHours,
            actualCost: totalCost,
        });
    }
    async updateWorkOrderStatusOnCompletion(workOrderId) {
        await this.workOrderRepository.update(workOrderId, {
            status: work_order_entity_1.WorkOrderStatus.COMPLETED,
            billingStatus: 'ready',
        });
    }
};
exports.TimeEntryService = TimeEntryService;
exports.TimeEntryService = TimeEntryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(work_order_time_entry_entity_1.WorkOrderTimeEntry)),
    __param(1, (0, typeorm_1.InjectRepository)(work_order_entity_1.WorkOrder)),
    __param(2, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TimeEntryService);
//# sourceMappingURL=time-entry.service.js.map