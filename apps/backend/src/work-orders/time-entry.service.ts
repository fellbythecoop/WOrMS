import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkOrderTimeEntry, TimeEntryType } from './entities/work-order-time-entry.entity';
import { WorkOrder, WorkOrderStatus } from './entities/work-order.entity';
import { Customer } from '../customers/entities/customer.entity';
import { User } from '../users/entities/user.entity';

export interface CreateTimeEntryDto {
  workOrderId: string;
  technicianId: string;
  timeEntryType: TimeEntryType;
  hours: number;
  description?: string;
  report?: string;
  workCompleted?: boolean;
  date: Date;
}

export interface UpdateTimeEntryDto {
  timeEntryType?: TimeEntryType;
  hours?: number;
  description?: string;
  report?: string;
  workCompleted?: boolean;
  date?: Date;
}

@Injectable()
export class TimeEntryService {
  constructor(
    @InjectRepository(WorkOrderTimeEntry)
    private timeEntryRepository: Repository<WorkOrderTimeEntry>,
    @InjectRepository(WorkOrder)
    private workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createTimeEntry(createTimeEntryDto: CreateTimeEntryDto): Promise<WorkOrderTimeEntry> {
    const { workOrderId, technicianId, timeEntryType, hours, description, date } = createTimeEntryDto;

    // Validate work order exists
    const workOrder = await this.workOrderRepository.findOne({
      where: { id: workOrderId },
      relations: ['customer'],
    });
    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    // Validate technician exists
    const technician = await this.userRepository.findOne({
      where: { id: technicianId },
    });
    if (!technician) {
      throw new NotFoundException('Technician not found');
    }

    // Validate hours
    if (hours <= 0 || hours > 24) {
      throw new BadRequestException('Hours must be between 0 and 24');
    }

    // Get customer rates or use default rates
    const customer = workOrder.customer;
    let rate = 0;
    
    if (customer) {
      // Calculate rate based on time entry type from customer
      switch (timeEntryType) {
        case TimeEntryType.TRAVEL_TIME:
          rate = Number(customer.travelTimeRate);
          break;
        case TimeEntryType.STRAIGHT_TIME:
          rate = Number(customer.straightTimeRate);
          break;
        case TimeEntryType.OVERTIME:
          rate = Number(customer.overtimeRate);
          break;
        case TimeEntryType.DOUBLE_TIME:
          rate = Number(customer.doubleTimeRate);
          break;
        default:
          throw new BadRequestException('Invalid time entry type');
      }
    } else {
      // Use default rates if no customer is assigned
      switch (timeEntryType) {
        case TimeEntryType.TRAVEL_TIME:
          rate = 25.00; // Default travel time rate
          break;
        case TimeEntryType.STRAIGHT_TIME:
          rate = 50.00; // Default straight time rate
          break;
        case TimeEntryType.OVERTIME:
          rate = 75.00; // Default overtime rate
          break;
        case TimeEntryType.DOUBLE_TIME:
          rate = 100.00; // Default double time rate
          break;
        default:
          throw new BadRequestException('Invalid time entry type');
      }
    }

    if (rate <= 0) {
      throw new BadRequestException(`Rate not configured for ${timeEntryType}`);
    }

    // Calculate total amount
    const totalAmount = hours * rate;

    // Create time entry
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

    // Update work order totals
    await this.updateWorkOrderTotals(workOrderId);

    // Check if work is completed and update work order status
    if (createTimeEntryDto.workCompleted) {
      await this.updateWorkOrderStatusOnCompletion(workOrderId);
    }

    // Return the time entry with technician relation loaded
    return this.timeEntryRepository.findOne({
      where: { id: savedTimeEntry.id },
      relations: ['technician'],
    });
  }

  async updateTimeEntry(id: string, updateTimeEntryDto: UpdateTimeEntryDto): Promise<WorkOrderTimeEntry> {
    const timeEntry = await this.timeEntryRepository.findOne({
      where: { id },
      relations: ['workOrder', 'workOrder.customer'],
    });

    if (!timeEntry) {
      throw new NotFoundException('Time entry not found');
    }

    // If hours or time entry type is being updated, recalculate rate and total
    if (updateTimeEntryDto.hours !== undefined || updateTimeEntryDto.timeEntryType !== undefined) {
      const hours = updateTimeEntryDto.hours ?? timeEntry.hours;
      const timeEntryType = updateTimeEntryDto.timeEntryType ?? timeEntry.timeEntryType;

      // Validate hours
      if (hours <= 0 || hours > 24) {
        throw new BadRequestException('Hours must be between 0 and 24');
      }

      // Get customer rates or use default rates
      const customer = timeEntry.workOrder.customer;
      let rate = 0;
      
      if (customer) {
        // Calculate new rate based on time entry type from customer
        switch (timeEntryType) {
          case TimeEntryType.TRAVEL_TIME:
            rate = Number(customer.travelTimeRate);
            break;
          case TimeEntryType.STRAIGHT_TIME:
            rate = Number(customer.straightTimeRate);
            break;
          case TimeEntryType.OVERTIME:
            rate = Number(customer.overtimeRate);
            break;
          case TimeEntryType.DOUBLE_TIME:
            rate = Number(customer.doubleTimeRate);
            break;
          default:
            throw new BadRequestException('Invalid time entry type');
        }
      } else {
        // Use default rates if no customer is assigned
        switch (timeEntryType) {
          case TimeEntryType.TRAVEL_TIME:
            rate = 25.00; // Default travel time rate
            break;
          case TimeEntryType.STRAIGHT_TIME:
            rate = 50.00; // Default straight time rate
            break;
          case TimeEntryType.OVERTIME:
            rate = 75.00; // Default overtime rate
            break;
          case TimeEntryType.DOUBLE_TIME:
            rate = 100.00; // Default double time rate
            break;
          default:
            throw new BadRequestException('Invalid time entry type');
        }
      }

      if (rate <= 0) {
        throw new BadRequestException(`Rate not configured for ${timeEntryType}`);
      }

      // Update time entry
      Object.assign(timeEntry, {
        ...updateTimeEntryDto,
        rate,
        totalAmount: hours * rate,
      });
    } else {
      // Just update other fields
      Object.assign(timeEntry, updateTimeEntryDto);
    }

    const savedTimeEntry = await this.timeEntryRepository.save(timeEntry);

    // Update work order totals
    await this.updateWorkOrderTotals(timeEntry.workOrderId);

    // Check if work is completed and update work order status
    if (updateTimeEntryDto.workCompleted) {
      await this.updateWorkOrderStatusOnCompletion(timeEntry.workOrderId);
    }

    return savedTimeEntry;
  }

  async deleteTimeEntry(id: string): Promise<void> {
    const timeEntry = await this.timeEntryRepository.findOne({
      where: { id },
    });

    if (!timeEntry) {
      throw new NotFoundException('Time entry not found');
    }

    await this.timeEntryRepository.remove(timeEntry);

    // Update work order totals
    await this.updateWorkOrderTotals(timeEntry.workOrderId);
  }

  async getTimeEntriesByWorkOrder(workOrderId: string): Promise<WorkOrderTimeEntry[]> {
    return this.timeEntryRepository.find({
      where: { workOrderId },
      relations: ['technician'],
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async getTimeEntryById(id: string): Promise<WorkOrderTimeEntry> {
    const timeEntry = await this.timeEntryRepository.findOne({
      where: { id },
      relations: ['workOrder', 'technician'],
    });

    if (!timeEntry) {
      throw new NotFoundException('Time entry not found');
    }

    return timeEntry;
  }

  private async updateWorkOrderTotals(workOrderId: string): Promise<void> {
    // Get all time entries for the work order
    const timeEntries = await this.timeEntryRepository.find({
      where: { workOrderId },
    });

    // Calculate totals
    const totalHours = timeEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);
    const totalCost = timeEntries.reduce((sum, entry) => sum + Number(entry.totalAmount), 0);

    // Update work order
    await this.workOrderRepository.update(workOrderId, {
      actualHours: totalHours,
      actualCost: totalCost,
    });
  }

  private async updateWorkOrderStatusOnCompletion(workOrderId: string): Promise<void> {
    await this.workOrderRepository.update(workOrderId, {
      status: WorkOrderStatus.COMPLETED,
      billingStatus: 'ready',
    });
  }
} 