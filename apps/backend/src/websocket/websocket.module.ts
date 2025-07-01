import { Module, forwardRef } from '@nestjs/common';
import { WorkOrdersGateway } from './work-orders.gateway';
import { WorkOrdersModule } from '../work-orders/work-orders.module';

@Module({
  imports: [forwardRef(() => WorkOrdersModule)],
  providers: [WorkOrdersGateway],
  exports: [WorkOrdersGateway],
})
export class WebSocketModule {} 