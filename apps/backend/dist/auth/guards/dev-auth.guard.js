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
exports.DevAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
let DevAuthGuard = class DevAuthGuard extends jwt_auth_guard_1.JwtAuthGuard {
    constructor(configService) {
        super();
        this.configService = configService;
    }
    canActivate(context) {
        const nodeEnv = this.configService.get('NODE_ENV');
        const isDevelopment = !nodeEnv || nodeEnv === 'development';
        const hasAzureAdConfig = this.configService.get('AZURE_AD_CLIENT_ID') &&
            this.configService.get('AZURE_AD_CLIENT_ID') !== 'demo-client-id';
        if (isDevelopment && !hasAzureAdConfig) {
            const request = context.switchToHttp().getRequest();
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
        return super.canActivate(context);
    }
};
exports.DevAuthGuard = DevAuthGuard;
exports.DevAuthGuard = DevAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DevAuthGuard);
//# sourceMappingURL=dev-auth.guard.js.map