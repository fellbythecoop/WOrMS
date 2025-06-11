import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BearerStrategy } from 'passport-azure-ad';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AzureAdStrategy extends PassportStrategy(BearerStrategy, 'azure-ad') {
  constructor(private readonly configService: ConfigService) {
    super({
      identityMetadata: `https://login.microsoftonline.com/${configService.get('AZURE_AD_TENANT_ID')}/v2.0/.well-known/openid_configuration`,
      clientID: configService.get('AZURE_AD_CLIENT_ID'),
      audience: configService.get('AZURE_AD_CLIENT_ID'),
      validateIssuer: true,
      issuer: `https://login.microsoftonline.com/${configService.get('AZURE_AD_TENANT_ID')}/v2.0`,
      passReqToCallback: false,
      scope: ['profile', 'openid', 'email'],
    });
  }

  async validate(payload: any): Promise<any> {
    return {
      azureAdObjectId: payload.oid,
      email: payload.email || payload.preferred_username,
      firstName: payload.given_name,
      lastName: payload.family_name,
    };
  }
} 