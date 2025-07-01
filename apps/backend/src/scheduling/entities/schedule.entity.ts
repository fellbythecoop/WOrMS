import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('schedules')
@Index(['technicianId', 'date'], { unique: true }) // Ensure one schedule per technician per day
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ 
    type: 'decimal', 
    precision: 4, 
    scale: 2, 
    default: 8.00,
    comment: 'Available hours for the technician on this date (default 8 hours)' 
  })
  availableHours: number;

  @Column({ 
    type: 'decimal', 
    precision: 4, 
    scale: 2, 
    default: 0.00,
    comment: 'Hours currently scheduled for work orders on this date' 
  })
  scheduledHours: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ 
    type: 'boolean', 
    default: true,
    comment: 'Whether the technician is available for work on this date' 
  })
  isAvailable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.schedules, { nullable: false })
  @JoinColumn({ name: 'technician_id' })
  technician: User;

  @Column({ name: 'technician_id' })
  technicianId: string;

  // Virtual fields
  get utilizationPercentage(): number {
    if (this.availableHours === 0) return 0;
    return Math.round((this.scheduledHours / this.availableHours) * 100);
  }

  get remainingHours(): number {
    return Math.max(0, this.availableHours - this.scheduledHours);
  }

  get isOverallocated(): boolean {
    return this.scheduledHours > this.availableHours;
  }

  get utilizationStatus(): 'under' | 'optimal' | 'over' {
    const utilization = this.utilizationPercentage;
    if (utilization < 80) return 'under';
    if (utilization > 100) return 'over';
    return 'optimal';
  }
} 