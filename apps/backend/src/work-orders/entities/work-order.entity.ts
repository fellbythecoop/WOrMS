import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Asset } from '../../assets/entities/asset.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { WorkOrderComment } from './work-order-comment.entity';
import { WorkOrderAttachment } from './work-order-attachment.entity';
import { WorkOrderTimeEntry } from './work-order-time-entry.entity';

export enum WorkOrderStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
}

export enum WorkOrderPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum WorkOrderType {
  MAINTENANCE = 'maintenance',
  REPAIR = 'repair',
  INSPECTION = 'inspection',
  INSTALLATION = 'installation',
  EMERGENCY = 'emergency',
}

@Entity('work_orders')
export class WorkOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  workOrderNumber: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'varchar',
    default: WorkOrderStatus.OPEN,
  })
  status: WorkOrderStatus;

  @Column({
    type: 'varchar',
    default: WorkOrderPriority.MEDIUM,
  })
  priority: WorkOrderPriority;

  @Column({
    type: 'varchar',
    default: WorkOrderType.MAINTENANCE,
  })
  type: WorkOrderType;

  @Column({ nullable: true })
  estimatedHours?: number;

  @Column({ nullable: true })
  actualHours?: number;

  @Column({ type: 'decimal', nullable: true })
  estimatedCost?: number;

  @Column({ type: 'decimal', nullable: true })
  actualCost?: number;

  @Column({ type: 'datetime', nullable: true })
  scheduledStartDate?: Date;

  @Column({ type: 'datetime', nullable: true })
  scheduledEndDate?: Date;

  @Column({ type: 'datetime', nullable: true })
  actualStartDate?: Date;

  @Column({ type: 'datetime', nullable: true })
  actualEndDate?: Date;

  @Column({ type: 'text', nullable: true })
  completionNotes?: string;

  @Column({ type: 'text', nullable: true })
  signature?: string; // Base64 encoded signature

  @Column({ type: 'text', nullable: true })
  metadata?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.assignedWorkOrders, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo?: User;

  @Column({ name: 'assigned_to_id', nullable: true })
  assignedToId?: string;

  @ManyToOne(() => Asset, asset => asset.workOrders, { nullable: true })
  @JoinColumn({ name: 'asset_id' })
  asset?: Asset;

  @Column({ name: 'asset_id', nullable: true })
  assetId?: string;

  @ManyToOne(() => Customer, customer => customer.workOrders, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;

  @Column({ name: 'customer_id', nullable: true })
  customerId?: string;

  @OneToMany(() => WorkOrderComment, comment => comment.workOrder)
  comments: WorkOrderComment[];

  @OneToMany(() => WorkOrderAttachment, attachment => attachment.workOrder)
  attachments: WorkOrderAttachment[];

  @OneToMany(() => WorkOrderTimeEntry, timeEntry => timeEntry.workOrder)
  timeEntries: WorkOrderTimeEntry[];

  // Virtual fields
  get isOverdue(): boolean {
    if (!this.scheduledEndDate) return false;
    return new Date() > this.scheduledEndDate && 
           ![WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED, WorkOrderStatus.CLOSED].includes(this.status);
  }

  get daysOverdue(): number {
    if (!this.isOverdue) return 0;
    const today = new Date();
    const scheduledEnd = new Date(this.scheduledEndDate!);
    return Math.floor((today.getTime() - scheduledEnd.getTime()) / (1000 * 3600 * 24));
  }

  get duration(): number | null {
    if (!this.actualStartDate || !this.actualEndDate) return null;
    return Math.floor((this.actualEndDate.getTime() - this.actualStartDate.getTime()) / (1000 * 3600 * 24));
  }

  // Calculate total time and cost from time entries
  get totalTimeEntries(): number {
    return this.timeEntries?.reduce((total, entry) => total + Number(entry.hours), 0) || 0;
  }

  get totalTimeCost(): number {
    return this.timeEntries?.reduce((total, entry) => total + Number(entry.totalAmount), 0) || 0;
  }
} 