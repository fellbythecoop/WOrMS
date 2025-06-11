import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class DevAuthGuard extends JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext): boolean {
    const nodeEnv = this.configService.get('NODE_ENV');
    const isDevelopment = !nodeEnv || nodeEnv === 'development';
    const hasAzureAdConfig = this.configService.get('AZURE_AD_CLIENT_ID') && 
                            this.configService.get('AZURE_AD_CLIENT_ID') !== 'demo-client-id';

    // In development mode, always bypass authentication
    if (isDevelopment) {
      const request = context.switchToHttp().getRequest();
      // Add a mock user for development
      request.user = {
        id: 'dev-user-1',
        email: 'developer@company.com',
        firstName: 'Dev',
        lastName: 'User',
        role: 'administrator',
        status: 'active',
      };
      return true;
    }

    // Otherwise, use normal JWT authentication
    return super.canActivate(context) as boolean;
  }
} 