import { User } from '../../users/entities/user.entity';
export declare class Schedule {
    id: string;
    date: Date;
    availableHours: number;
    scheduledHours: number;
    notes?: string;
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
    technician: User;
    technicianId: string;
    get utilizationPercentage(): number;
    get remainingHours(): number;
    get isOverallocated(): boolean;
    get utilizationStatus(): 'under' | 'optimal' | 'over';
}
