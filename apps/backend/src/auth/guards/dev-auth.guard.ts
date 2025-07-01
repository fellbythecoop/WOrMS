import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class DevAuthGuard extends JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
        azureAdObjectId: 'dev-azure-id',
        department: 'Development',
        phoneNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log('DevAuthGuard: Bypassing authentication in development mode');
      return true;
    }

    // In production, check if Azure AD is configured
    if (!hasAzureAdConfig) {
      console.warn('DevAuthGuard: Azure AD not configured, falling back to dev mode');
      const request = context.switchToHttp().getRequest();
      request.user = {
        id: 'dev-user-1',
        email: 'developer@company.com',
        firstName: 'Dev',
        lastName: 'User',
        role: 'administrator',
        status: 'active',
        azureAdObjectId: 'dev-azure-id',
        department: 'Development',
        phoneNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return true;
    }

    // Otherwise, use normal JWT authentication
    try {
      const result = await super.canActivate(context);
      return result as boolean;
    } catch (error) {
      console.error('DevAuthGuard: JWT authentication failed, falling back to dev mode:', error.message);
      // Fall back to dev mode if JWT fails
      const request = context.switchToHttp().getRequest();
      request.user = {
        id: 'dev-user-1',
        email: 'developer@company.com',
        firstName: 'Dev',
        lastName: 'User',
        role: 'administrator',
        status: 'active',
        azureAdObjectId: 'dev-azure-id',
        department: 'Development',
        phoneNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return true;
    }
  }
} 