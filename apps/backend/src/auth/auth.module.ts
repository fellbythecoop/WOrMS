import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AzureAdStrategy } from './strategies/azure-ad.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DevAuthGuard } from './guards/dev-auth.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // Conditionally provide AzureAdStrategy only if Azure AD is configured
    {
      provide: AzureAdStrategy,
      useFactory: (configService: ConfigService) => {
        const clientId = configService.get<string>('AZURE_AD_CLIENT_ID');
        const tenantId = configService.get<string>('AZURE_AD_TENANT_ID');
        
        // Only create strategy if Azure AD is properly configured
        if (clientId && tenantId && clientId !== 'demo-client-id') {
          return new AzureAdStrategy(configService);
        }
        return null; // Return null if not configured (development mode)
      },
      inject: [ConfigService],
    },
    JwtStrategy,
    DevAuthGuard,
  ],
  exports: [AuthService, DevAuthGuard],
})
export class AuthModule {} 