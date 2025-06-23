import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkOrder } from './work-order.entity';
import { User } from '../../users/entities/user.entity';

export enum TimeEntryType {
  TRAVEL_TIME = 'travel_time',
  STRAIGHT_TIME = 'straight_time',
  OVERTIME = 'overtime',
  DOUBLE_TIME = 'double_time',
}

@Entity('work_order_time_entries')
export class WorkOrderTimeEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
  })
  timeEntryType: TimeEntryType;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  hours: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  rate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  report?: string;

  @Column({ type: 'boolean', default: false })
  workCompleted: boolean;

  @Column({ type: 'datetime' })
  date: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => WorkOrder, workOrder => workOrder.timeEntries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_order_id' })
  workOrder: WorkOrder;

  @Column({ name: 'work_order_id' })
  workOrderId: string;

  @ManyToOne(() => User, user => user.timeEntries)
  @JoinColumn({ name: 'technician_id' })
  technician: User;

  @Column({ name: 'technician_id' })
  technicianId: string;
} 