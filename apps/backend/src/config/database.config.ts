import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// Entities
import { User } from '../users/entities/user.entity';
import { WorkOrder } from '../work-orders/entities/work-order.entity';
import { Asset } from '../assets/entities/asset.entity';
import { WorkOrderComment } from '../work-orders/entities/work-order-comment.entity';
import { WorkOrderAttachment } from '../work-orders/entities/work-order-attachment.entity';
import { WorkOrderTimeEntry } from '../work-orders/entities/work-order-time-entry.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Schedule } from '../scheduling/entities/schedule.entity';

export const databaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  const dbHost = configService.get<string>('DB_HOST');
  
  // Use SQLite by default for development (when no external DB configured)
  // Only use PostgreSQL if explicitly configured with DB_HOST
  if (nodeEnv === 'development' || !dbHost) {
    return {
      type: 'sqlite',
      database: configService.get<string>('DB_NAME', 'woms') + '.sqlite',
      entities: [
        User,
        WorkOrder,
        Asset,
        WorkOrderComment,
        WorkOrderAttachment,
        WorkOrderTimeEntry,
        Customer,
        Schedule,
      ],
      synchronize: true, // Auto-create tables in development
      logging: configService.get<boolean>('DB_LOGGING', false),
    };
  }

  // PostgreSQL configuration for production
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', 'password'),
    database: configService.get<string>('DB_NAME', 'woms'),
    entities: [
      User,
      WorkOrder,
      Asset,
      WorkOrderComment,
      WorkOrderAttachment,
      WorkOrderTimeEntry,
      Customer,
      Schedule,
    ],
    migrations: ['dist/migrations/*.js'],
    synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
    logging: configService.get<boolean>('DB_LOGGING', false),
    ssl: configService.get<boolean>('DB_SSL', false) 
      ? { rejectUnauthorized: false } 
      : false,
  };
};

// DataSource for migrations
export const AppDataSource = new DataSource({
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