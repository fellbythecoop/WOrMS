import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrder } from './entities/work-order.entity';
import { WorkOrderComment } from './entities/work-order-comment.entity';
import { WorkOrderAttachment } from './entities/work-order-attachment.entity';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';
import { UsersModule } from '../users/users.module';
import { AssetsModule } from '../assets/assets.module';
import { CacheService } from '../cache/cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkOrder,
      WorkOrderComment,
      WorkOrderAttachment,
    ]),
    UsersModule,
    AssetsModule,
  ],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService, CacheService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {} 