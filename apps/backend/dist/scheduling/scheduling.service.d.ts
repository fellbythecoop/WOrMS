import { Repository } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { User } from '../users/entities/user.entity';
import { CreateScheduleDto, UpdateScheduleDto, ScheduleQueryDto } from './dto/schedule.dto';
import { WorkOrdersGateway } from '../websocket/work-orders.gateway';
export declare class SchedulingService {
    private readonly scheduleRepository;
    private readonly userRepository;
    private readonly workOrdersGateway;
    private readonly logger;
    constructor(scheduleRepository: Repository<Schedule>, userRepository: Repository<User>, workOrdersGateway: WorkOrdersGateway);
    create(createScheduleDto: CreateScheduleDto): Promise<Schedule>;
    findAll(query?: ScheduleQueryDto): Promise<Schedule[]>;
    findOne(id: string): Promise<Schedule>;
    update(id: string, updateScheduleDto: UpdateScheduleDto): Promise<Schedule>;
    remove(id: string): Promise<void>;
    findByTechnicianAndDateRange(technicianId: string, startDate: Date, endDate: Date): Promise<Schedule[]>;
    setScheduledHours(technicianId: string, date: Date, totalHours: number): Promise<Schedule>;
    private generateUUID;
    getUtilizationStats(technicianId?: string, startDate?: Date, endDate?: Date): Promise<{
        totalSchedules: number;
        totalAvailableHours: number;
        totalScheduledHours: number;
        averageUtilization: number;
        overallocatedCount: number;
        underutilizedCount: number;
        optimalCount: number;
        schedules: Schedule[];
    }>;
    private validateTechnician;
    seedSampleSchedules(): Promise<Schedule[]>;
}
