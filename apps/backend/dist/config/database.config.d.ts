import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
export declare const databaseConfig: (configService: ConfigService) => TypeOrmModuleOptions;
export declare const AppDataSource: DataSource;
