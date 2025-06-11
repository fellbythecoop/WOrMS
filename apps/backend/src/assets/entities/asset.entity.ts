import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';

export enum AssetStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
}

export enum AssetCategory {
  EQUIPMENT = 'equipment',
  FACILITY = 'facility',
  VEHICLE = 'vehicle',
  IT = 'it',
  FURNITURE = 'furniture',
  OTHER = 'other',
}

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  assetNumber: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'varchar',
    default: AssetCategory.EQUIPMENT,
  })
  category: AssetCategory;

  @Column({
    type: 'varchar',
    default: AssetStatus.ACTIVE,
  })
  status: AssetStatus;

  @Column({ nullable: true })
  manufacturer?: string;

  @Column({ nullable: true })
  model?: string;

  @Column({ nullable: true })
  serialNumber?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  department?: string;

  @Column({ type: 'decimal', nullable: true })
  purchasePrice?: number;

  @Column({ type: 'datetime', nullable: true })
  purchaseDate?: Date;

  @Column({ type: 'datetime', nullable: true })
  warrantyExpiration?: Date;

  @Column({ type: 'datetime', nullable: true })
  lastMaintenanceDate?: Date;

  @Column({ type: 'datetime', nullable: true })
  nextMaintenanceDate?: Date;

  @Column({ type: 'text', nullable: true })
  specifications?: string;

  @Column({ type: 'text', nullable: true })
  imageUrls?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => WorkOrder, workOrder => workOrder.asset)
  workOrders: WorkOrder[];

  // Virtual fields
  get isUnderWarranty(): boolean {
    if (!this.warrantyExpiration) return false;
    return new Date() < this.warrantyExpiration;
  }

  get isMaintenanceDue(): boolean {
    if (!this.nextMaintenanceDate) return false;
    return new Date() >= this.nextMaintenanceDate;
  }

  get age(): number {
    if (!this.purchaseDate) return 0;
    const today = new Date();
    const purchase = new Date(this.purchaseDate);
    return today.getFullYear() - purchase.getFullYear();
  }
} 