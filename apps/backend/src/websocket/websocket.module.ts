import { Module } from '@nestjs/common';
import { WorkOrdersGateway } from './work-orders.gateway';
import { WorkOrdersModule } from '../work-orders/work-orders.module';

@Module({
  imports: [WorkOrdersModule],
  providers: [WorkOrdersGateway],
  exports: [WorkOrdersGateway],
})
export class WebSocketModule {} 