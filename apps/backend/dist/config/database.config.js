"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = exports.databaseConfig = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
const work_order_entity_1 = require("../work-orders/entities/work-order.entity");
const asset_entity_1 = require("../assets/entities/asset.entity");
const work_order_comment_entity_1 = require("../work-orders/entities/work-order-comment.entity");
const work_order_attachment_entity_1 = require("../work-orders/entities/work-order-attachment.entity");
const databaseConfig = (configService) => {
    const nodeEnv = configService.get('NODE_ENV') || 'development';
    const dbHost = configService.get('DB_HOST');
    if (nodeEnv === 'development' || !dbHost) {
        return {
            type: 'sqlite',
            database: configService.get('DB_NAME', 'woms') + '.sqlite',
            entities: [
                user_entity_1.User,
                work_order_entity_1.WorkOrder,
                asset_entity_1.Asset,
                work_order_comment_entity_1.WorkOrderComment,
                work_order_attachment_entity_1.WorkOrderAttachment,
            ],
            synchronize: true,
            logging: configService.get('DB_LOGGING', false),
        };
    }
    return {
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_NAME', 'woms'),
        entities: [
            user_entity_1.User,
            work_order_entity_1.WorkOrder,
            asset_entity_1.Asset,
            work_order_comment_entity_1.WorkOrderComment,
            work_order_attachment_entity_1.WorkOrderAttachment,
        ],
        migrations: ['dist/migrations/*.js'],
        synchronize: configService.get('DB_SYNCHRONIZE', false),
        logging: configService.get('DB_LOGGING', false),
        ssl: configService.get('DB_SSL', false)
            ? { rejectUnauthorized: false }
            : false,
    };
};
exports.databaseConfig = databaseConfig;
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'woms',
    entities: [
        'src/**/*.entity.ts',
    ],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
});
//# sourceMappingURL=database.config.js.map