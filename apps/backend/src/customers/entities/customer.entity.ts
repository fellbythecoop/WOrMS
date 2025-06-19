import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ nullable: true })
  primaryContactName?: string;

  @Column({ nullable: true })
  primaryContactPhone?: string;

  @Column({ nullable: true })
  primaryContactEmail?: string;

  @Column({ nullable: true })
  secondaryContactName?: string;

  @Column({ nullable: true })
  secondaryContactPhone?: string;

  @Column({ nullable: true })
  secondaryContactEmail?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Rate configurations
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  travelTimeRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  straightTimeRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  overtimeRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  doubleTimeRate: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => WorkOrder, workOrder => workOrder.customer)
  workOrders: WorkOrder[];
} 