"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureAdStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_azure_ad_1 = require("passport-azure-ad");
const config_1 = require("@nestjs/config");
let AzureAdStrategy = class AzureAdStrategy extends (0, passport_1.PassportStrategy)(passport_azure_ad_1.BearerStrategy, 'azure-ad') {
    constructor(configService) {
        super({
            identityMetadata: `https://login.microsoftonline.com/${configService.get('AZURE_AD_TENANT_ID')}/v2.0/.well-known/openid_configuration`,
            clientID: configService.get('AZURE_AD_CLIENT_ID'),
            audience: configService.get('AZURE_AD_CLIENT_ID'),
            validateIssuer: true,
            issuer: `https://login.microsoftonline.com/${configService.get('AZURE_AD_TENANT_ID')}/v2.0`,
            passReqToCallback: false,
            scope: ['profile', 'openid', 'email'],
        });
        this.configService = configService;
    }
    async validate(payload) {
        return {
            azureAdObjectId: payload.oid,
            email: payload.email || payload.preferred_username,
            firstName: payload.given_name,
            lastName: payload.family_name,
        };
    }
};
exports.AzureAdStrategy = AzureAdStrategy;
exports.AzureAdStrategy = AzureAdStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AzureAdStrategy);
//# sourceMappingURL=azure-ad.strategy.js.map