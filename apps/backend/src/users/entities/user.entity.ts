import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';
import { WorkOrderTimeEntry } from '../../work-orders/entities/work-order-time-entry.entity';

export enum UserRole {
  TECHNICIAN = 'technician',
  ADMINISTRATOR = 'administrator',
  REQUESTER = 'requester',
  MANAGER = 'manager',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  department?: string;

  @Column({
    type: 'varchar',
    default: UserRole.REQUESTER,
  })
  role: UserRole;

  @Column({
    type: 'varchar',
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ nullable: true })
  azureAdObjectId?: string;

  @Column({ nullable: true })
  profilePictureUrl?: string;

  @Column({ type: 'text', nullable: true })
  preferences?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  lastLoginAt?: Date;

  // Relations
  @OneToMany(() => WorkOrder, workOrder => workOrder.assignedTo)
  assignedWorkOrders: WorkOrder[];

  @OneToMany(() => WorkOrderTimeEntry, timeEntry => timeEntry.technician)
  timeEntries: WorkOrderTimeEntry[];

  // Virtual fields
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }
} 