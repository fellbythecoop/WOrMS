export declare class CreateScheduleDto {
    technicianId: string;
    date: Date;
    availableHours?: number;
    scheduledHours?: number;
    notes?: string;
    isAvailable?: boolean;
}
declare const UpdateScheduleDto_base: import("@nestjs/common").Type<Partial<CreateScheduleDto>>;
export declare class UpdateScheduleDto extends UpdateScheduleDto_base {
}
export declare class ScheduleQueryDto {
    technicianId?: string;
    startDate?: string;
    endDate?: string;
    isAvailable?: boolean;
    utilizationStatus?: 'under' | 'optimal' | 'over';
}
export declare class ScheduleResponseDto {
    id: string;
    date: Date;
    availableHours: number;
    scheduledHours: number;
    notes?: string;
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
    technicianId: string;
    technician: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
    };
    utilizationPercentage: number;
    remainingHours: number;
    isOverallocated: boolean;
    utilizationStatus: 'under' | 'optimal' | 'over';
}
export declare class UtilizationStatsDto {
    totalSchedules: number;
    totalAvailableHours: number;
    totalScheduledHours: number;
    averageUtilization: number;
    overallocatedCount: number;
    underutilizedCount: number;
    optimalCount: number;
    schedules: ScheduleResponseDto[];
}
export {};
