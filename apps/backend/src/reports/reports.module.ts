import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { WorkOrdersModule } from '../work-orders/work-orders.module';
import { AssetsModule } from '../assets/assets.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    WorkOrdersModule,
    AssetsModule,
    UsersModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {} 