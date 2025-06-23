import { Repository } from 'typeorm';
import { WorkOrderTimeEntry, TimeEntryType } from './entities/work-order-time-entry.entity';
import { WorkOrder } from './entities/work-order.entity';
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
export declare class TimeEntryService {
    private timeEntryRepository;
    private workOrderRepository;
    private customerRepository;
    private userRepository;
    constructor(timeEntryRepository: Repository<WorkOrderTimeEntry>, workOrderRepository: Repository<WorkOrder>, customerRepository: Repository<Customer>, userRepository: Repository<User>);
    createTimeEntry(createTimeEntryDto: CreateTimeEntryDto): Promise<WorkOrderTimeEntry>;
    updateTimeEntry(id: string, updateTimeEntryDto: UpdateTimeEntryDto): Promise<WorkOrderTimeEntry>;
    deleteTimeEntry(id: string): Promise<void>;
    getTimeEntriesByWorkOrder(workOrderId: string): Promise<WorkOrderTimeEntry[]>;
    getTimeEntryById(id: string): Promise<WorkOrderTimeEntry>;
    private updateWorkOrderTotals;
    private updateWorkOrderStatusOnCompletion;
}
