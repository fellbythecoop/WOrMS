"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkOrdersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const work_order_entity_1 = require("./entities/work-order.entity");
const work_order_comment_entity_1 = require("./entities/work-order-comment.entity");
const work_order_attachment_entity_1 = require("./entities/work-order-attachment.entity");
const work_order_time_entry_entity_1 = require("./entities/work-order-time-entry.entity");
const work_orders_controller_1 = require("./work-orders.controller");
const work_orders_service_1 = require("./work-orders.service");
const time_entry_service_1 = require("./time-entry.service");
const users_module_1 = require("../users/users.module");
const assets_module_1 = require("../assets/assets.module");
const customers_module_1 = require("../customers/customers.module");
const scheduling_module_1 = require("../scheduling/scheduling.module");
const websocket_module_1 = require("../websocket/websocket.module");
const cache_service_1 = require("../cache/cache.service");
const user_entity_1 = require("../users/entities/user.entity");
const customer_entity_1 = require("../customers/entities/customer.entity");
let WorkOrdersModule = class WorkOrdersModule {
};
exports.WorkOrdersModule = WorkOrdersModule;
exports.WorkOrdersModule = WorkOrdersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                work_order_entity_1.WorkOrder,
                work_order_comment_entity_1.WorkOrderComment,
                work_order_attachment_entity_1.WorkOrderAttachment,
                work_order_time_entry_entity_1.WorkOrderTimeEntry,
                user_entity_1.User,
                customer_entity_1.Customer,
            ]),
            users_module_1.UsersModule,
            assets_module_1.AssetsModule,
            customers_module_1.CustomersModule,
            scheduling_module_1.SchedulingModule,
            (0, common_1.forwardRef)(() => websocket_module_1.WebSocketModule),
        ],
        controllers: [work_orders_controller_1.WorkOrdersController],
        providers: [work_orders_service_1.WorkOrdersService, time_entry_service_1.TimeEntryService, cache_service_1.CacheService],
        exports: [work_orders_service_1.WorkOrdersService, time_entry_service_1.TimeEntryService],
    })
], WorkOrdersModule);
//# sourceMappingURL=work-orders.module.js.map