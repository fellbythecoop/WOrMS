import { SchedulingService } from './scheduling.service';
import { CreateScheduleDto, UpdateScheduleDto, ScheduleQueryDto, UtilizationStatsDto } from './dto/schedule.dto';
export declare class SchedulingController {
    private readonly schedulingService;
    private readonly logger;
    constructor(schedulingService: SchedulingService);
    create(createScheduleDto: CreateScheduleDto): Promise<import("./entities/schedule.entity").Schedule>;
    findAll(query: ScheduleQueryDto): Promise<import("./entities/schedule.entity").Schedule[]>;
    getUtilizationStats(technicianId?: string, startDate?: string, endDate?: string): Promise<UtilizationStatsDto>;
    findByTechnicianAndDateRange(technicianId: string, startDate: string, endDate: string): Promise<import("./entities/schedule.entity").Schedule[]>;
    findOne(id: string): Promise<import("./entities/schedule.entity").Schedule>;
    update(id: string, updateScheduleDto: UpdateScheduleDto): Promise<import("./entities/schedule.entity").Schedule>;
    remove(id: string): Promise<void>;
    setScheduledHours(id: string, body: {
        totalHours: number;
    }): Promise<import("./entities/schedule.entity").Schedule>;
    setTechnicianScheduledHours(technicianId: string, body: {
        date: string;
        totalHours: number;
    }): Promise<import("./entities/schedule.entity").Schedule>;
    seedSampleSchedules(): Promise<import("./entities/schedule.entity").Schedule[]>;
}
