import { IsNotEmpty, IsOptional, IsString, IsDateString, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateScheduleDto {
  @ApiProperty({ description: 'ID of the technician to schedule' })
  @IsNotEmpty()
  @IsString()
  technicianId: string;

  @ApiProperty({ description: 'Date for the schedule (YYYY-MM-DD format)' })
  @IsNotEmpty()
  @IsDateString()
  @Transform(({ value }) => new Date(value))
  date: Date;

  @ApiPropertyOptional({ description: 'Available hours for the technician (default: 8.0)', default: 8.0, minimum: 0, maximum: 24 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(24)
  availableHours?: number;

  @ApiPropertyOptional({ description: 'Currently scheduled hours (default: 0.0)', default: 0.0, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  scheduledHours?: number;

  @ApiPropertyOptional({ description: 'Notes about the schedule' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Whether the technician is available (default: true)', default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {}

export class ScheduleQueryDto {
  @ApiPropertyOptional({ description: 'Filter by technician ID' })
  @IsOptional()
  @IsString()
  technicianId?: string;

  @ApiPropertyOptional({ description: 'Filter schedules from this date onwards (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter schedules up to this date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by availability status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isAvailable?: boolean;

  @ApiPropertyOptional({ 
    description: 'Filter by utilization status', 
    enum: ['under', 'optimal', 'over'],
  })
  @IsOptional()
  @IsString()
  utilizationStatus?: 'under' | 'optimal' | 'over';
}

export class ScheduleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  availableHours: number;

  @ApiProperty()
  scheduledHours: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  isAvailable: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  technicianId: string;

  @ApiProperty()
  technician: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };

  @ApiProperty({ description: 'Calculated utilization percentage' })
  utilizationPercentage: number;

  @ApiProperty({ description: 'Remaining available hours' })
  remainingHours: number;

  @ApiProperty({ description: 'Whether the technician is over-allocated' })
  isOverallocated: boolean;

  @ApiProperty({ description: 'Utilization status category' })
  utilizationStatus: 'under' | 'optimal' | 'over';
}

export class UtilizationStatsDto {
  @ApiProperty()
  totalSchedules: number;

  @ApiProperty()
  totalAvailableHours: number;

  @ApiProperty()
  totalScheduledHours: number;

  @ApiProperty()
  averageUtilization: number;

  @ApiProperty()
  overallocatedCount: number;

  @ApiProperty()
  underutilizedCount: number;

  @ApiProperty()
  optimalCount: number;

  @ApiProperty({ type: [ScheduleResponseDto] })
  schedules: ScheduleResponseDto[];
} 