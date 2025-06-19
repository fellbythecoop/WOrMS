import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrder } from './entities/work-order.entity';
import { WorkOrderComment } from './entities/work-order-comment.entity';
import { WorkOrderAttachment } from './entities/work-order-attachment.entity';
import { WorkOrderTimeEntry } from './entities/work-order-time-entry.entity';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';
import { TimeEntryService } from './time-entry.service';
import { UsersModule } from '../users/users.module';
import { AssetsModule } from '../assets/assets.module';
import { CustomersModule } from '../customers/customers.module';
import { CacheService } from '../cache/cache.service';
import { User } from '../users/entities/user.entity';
import { Customer } from '../customers/entities/customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkOrder,
      WorkOrderComment,
      WorkOrderAttachment,
      WorkOrderTimeEntry,
      User,
      Customer,
    ]),
    UsersModule,
    AssetsModule,
    CustomersModule,
  ],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService, TimeEntryService, CacheService],
  exports: [WorkOrdersService, TimeEntryService],
})
export class WorkOrdersModule {} 