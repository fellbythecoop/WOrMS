import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, Not } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateScheduleDto, UpdateScheduleDto, ScheduleQueryDto } from './dto/schedule.dto';
import { WorkOrdersGateway } from '../websocket/work-orders.gateway';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => WorkOrdersGateway))
    private readonly workOrdersGateway: WorkOrdersGateway,
  ) {}

  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    try {
      // Validate technician exists and has appropriate role
      const technician = await this.validateTechnician(createScheduleDto.technicianId);

      // Check if schedule already exists for this technician on this date
      const existingSchedule = await this.scheduleRepository.findOne({
        where: {
          technicianId: createScheduleDto.technicianId,
          date: createScheduleDto.date,
        },
      });

      if (existingSchedule) {
        throw new ConflictException(
          `Schedule already exists for technician ${technician.fullName} on ${createScheduleDto.date}`
        );
      }

      const schedule = this.scheduleRepository.create({
        ...createScheduleDto,
        availableHours: createScheduleDto.availableHours || 8.0, // Default 8 hours
      });

      const savedSchedule = await this.scheduleRepository.save(schedule);
      
      this.logger.log(`Created schedule ${savedSchedule.id} for technician ${technician.fullName} on ${createScheduleDto.date}`);
      
      return this.findOne(savedSchedule.id);
    } catch (error) {
      this.logger.error(`Failed to create schedule: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(query: ScheduleQueryDto = {}): Promise<Schedule[]> {
    try {
      const queryBuilder = this.scheduleRepository
        .createQueryBuilder('schedule')
        .leftJoinAndSelect('schedule.technician', 'technician')
        .orderBy('schedule.date', 'ASC')
        .addOrderBy('technician.firstName', 'ASC');

      // Filter by technician
      if (query.technicianId) {
        queryBuilder.andWhere('schedule.technicianId = :technicianId', { 
          technicianId: query.technicianId 
        });
      }

      // Filter by date range
      if (query.startDate && query.endDate) {
        const startDate = new Date(query.startDate);
        const endDate = new Date(query.endDate);
        queryBuilder.andWhere('schedule.date BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      } else if (query.startDate) {
        const startDate = new Date(query.startDate);
        queryBuilder.andWhere('schedule.date >= :startDate', { startDate });
      } else if (query.endDate) {
        const endDate = new Date(query.endDate);
        queryBuilder.andWhere('schedule.date <= :endDate', { endDate });
      }

      // Filter by availability
      if (query.isAvailable !== undefined) {
        queryBuilder.andWhere('schedule.isAvailable = :isAvailable', { 
          isAvailable: query.isAvailable 
        });
      }

      // Filter by utilization status
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
    } catch (error) {
      this.logger.error(`Failed to fetch schedules: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<Schedule> {
    try {
      const schedule = await this.scheduleRepository.findOne({
        where: { id },
        relations: ['technician'],
      });

      if (!schedule) {
        throw new NotFoundException(`Schedule with ID ${id} not found`);
      }

      return schedule;
    } catch (error) {
      this.logger.error(`Failed to fetch schedule ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateScheduleDto: UpdateScheduleDto): Promise<Schedule> {
    try {
      const schedule = await this.findOne(id);

      // Validate technician if changing
      if (updateScheduleDto.technicianId && updateScheduleDto.technicianId !== schedule.technicianId) {
        await this.validateTechnician(updateScheduleDto.technicianId);
      }

      // Check for conflicts if changing date or technician
      if ((updateScheduleDto.date && updateScheduleDto.date !== schedule.date) || 
          (updateScheduleDto.technicianId && updateScheduleDto.technicianId !== schedule.technicianId)) {
        
        const conflictingSchedule = await this.scheduleRepository.findOne({
          where: {
            technicianId: updateScheduleDto.technicianId || schedule.technicianId,
            date: updateScheduleDto.date || schedule.date,
            id: Not(id),
          },
        });

        if (conflictingSchedule) {
          throw new ConflictException('Schedule conflict detected');
        }
      }

      await this.scheduleRepository.update(id, updateScheduleDto);
      
      this.logger.log(`Updated schedule ${id}`);
      
      return this.findOne(id);
    } catch (error) {
      this.logger.error(`Failed to update schedule ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const schedule = await this.findOne(id);
      
      await this.scheduleRepository.remove(schedule);
      
      this.logger.log(`Deleted schedule ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete schedule ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByTechnicianAndDateRange(technicianId: string, startDate: Date, endDate: Date): Promise<Schedule[]> {
    try {
      return await this.scheduleRepository.find({
        where: {
          technicianId,
          date: Between(startDate, endDate),
        },
        relations: ['technician'],
        order: { date: 'ASC' },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch schedules for technician ${technicianId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async setScheduledHours(technicianId: string, date: Date, totalHours: number): Promise<Schedule> {
    const dateString = date.toISOString().split('T')[0];
    
    try {
      // Use raw SQL for true upsert with SQLite's INSERT OR REPLACE
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
        technicianId, date, this.generateUUID(), // For new records
        technicianId, 
        date, 
        Math.max(0, totalHours),
        technicianId, date // For preserving created_at
      ]);

      // Fetch the updated/created schedule
      const schedule = await this.scheduleRepository.findOne({
        where: { technicianId, date },
        relations: ['technician'],
      });

      if (!schedule) {
        throw new Error(`Failed to retrieve schedule after upsert for technician ${technicianId} on ${dateString}`);
      }

      this.logger.log(`Set scheduled hours for technician ${technicianId} on ${dateString}: ${totalHours} hours`);
      return schedule;

    } catch (error) {
      this.logger.error(`Failed to set scheduled hours: ${error.message}`, error.stack);
      throw error;
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async getUtilizationStats(technicianId?: string, startDate?: Date, endDate?: Date) {
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
    } catch (error) {
      this.logger.error(`Failed to get utilization stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async validateTechnician(technicianId: string): Promise<User> {
    const technician = await this.userRepository.findOne({
      where: { id: technicianId },
    });

    if (!technician) {
      throw new NotFoundException(`Technician with ID ${technicianId} not found`);
    }

    if (technician.role !== UserRole.TECHNICIAN && technician.role !== UserRole.ADMINISTRATOR) {
      throw new BadRequestException(
        `User ${technician.fullName} is not a technician or administrator`
      );
    }

    return technician;
  }

  async seedSampleSchedules(): Promise<Schedule[]> {
    try {
      // Check if schedules already exist
      const existingSchedules = await this.scheduleRepository.count();
      if (existingSchedules > 0) {
        this.logger.log('Sample schedules already exist, returning existing schedules');
        return this.findAll();
      }

      // Get technicians for sample data
      const technicians = await this.userRepository.find({
        where: [
          { role: UserRole.TECHNICIAN },
          { role: UserRole.ADMINISTRATOR }
        ]
      });

      if (technicians.length === 0) {
        throw new Error('Please seed users first by calling POST /api/users/seed');
      }

      const sampleSchedules = [];
      const today = new Date();
      
      // Create schedules for the next 30 days for each technician
      for (const technician of technicians) {
        for (let dayOffset = -7; dayOffset <= 30; dayOffset++) {
          const scheduleDate = new Date(today);
          scheduleDate.setDate(today.getDate() + dayOffset);
          
          // Skip weekends for most schedules
          const dayOfWeek = scheduleDate.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            continue; // Skip Sunday (0) and Saturday (6)
          }

          const scheduledHours = Math.random() > 0.3 ? Math.floor(Math.random() * 6) + 2 : 0; // 2-8 hours or 0
          const availableHours = 8.0;
          
          sampleSchedules.push({
            technicianId: technician.id,
            date: scheduleDate,
            availableHours,
            scheduledHours,
            isAvailable: Math.random() > 0.1, // 90% available
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
        } catch (error) {
          // Skip duplicates or conflicts
          this.logger.warn(`Skipped schedule creation: ${error.message}`);
        }
      }

      this.logger.log(`Created ${createdSchedules.length} sample schedules`);
      return this.findAll();
    } catch (error) {
      this.logger.error(`Failed to seed sample schedules: ${error.message}`, error.stack);
      throw error;
    }
  }
} 