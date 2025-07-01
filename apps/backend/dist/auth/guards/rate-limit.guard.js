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
exports.RateLimitLenient = exports.RateLimitModerate = exports.RateLimitStrict = exports.RateLimitGuard = exports.RateLimit = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const DEFAULT_RATE_LIMITS = {
    strict: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
    moderate: { windowMs: 15 * 60 * 1000, maxRequests: 100 },
    lenient: { windowMs: 15 * 60 * 1000, maxRequests: 1000 },
};
const RATE_LIMIT_KEY = 'rateLimit';
const RateLimit = (config) => {
    return (0, common_1.SetMetadata)(RATE_LIMIT_KEY, config);
};
exports.RateLimit = RateLimit;
let RateLimitGuard = class RateLimitGuard {
    constructor(reflector) {
        this.reflector = reflector;
        this.rateLimitStore = new Map();
    }
    async canActivate(context) {
        const rateLimitConfig = this.reflector.get(RATE_LIMIT_KEY, context.getHandler());
        if (!rateLimitConfig) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const clientId = this.getClientIdentifier(request);
        const config = typeof rateLimitConfig === 'string'
            ? DEFAULT_RATE_LIMITS[rateLimitConfig]
            : rateLimitConfig;
        const now = Date.now();
        const key = `${clientId}:${context.getHandler().name}`;
        let entry = this.rateLimitStore.get(key);
        if (!entry || now > entry.resetTime) {
            entry = {
                count: 0,
                resetTime: now + config.windowMs,
            };
        }
        entry.count++;
        this.rateLimitStore.set(key, entry);
        if (entry.count > config.maxRequests) {
            const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000);
            const message = config.message || 'Too many requests';
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
                message,
                error: 'Rate Limit Exceeded',
                retryAfter: resetTimeSeconds,
            }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        const response = context.switchToHttp().getResponse();
        response.setHeader('X-RateLimit-Limit', config.maxRequests);
        response.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - entry.count));
        response.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));
        return true;
    }
    getClientIdentifier(request) {
        const userId = request.user?.id;
        if (userId) {
            return `user:${userId}`;
        }
        const apiKey = request.headers['x-api-key'];
        if (apiKey) {
            return `api:${apiKey}`;
        }
        const forwarded = request.headers['x-forwarded-for'];
        const ip = forwarded
            ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0])
            : request.connection.remoteAddress;
        return `ip:${ip}`;
    }
    cleanupExpiredEntries() {
        const now = Date.now();
        for (const [key, entry] of this.rateLimitStore.entries()) {
            if (now > entry.resetTime) {
                this.rateLimitStore.delete(key);
            }
        }
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RateLimitGuard);
const RateLimitStrict = () => (0, exports.RateLimit)({
    ...DEFAULT_RATE_LIMITS.strict,
    message: 'Too many requests to this sensitive endpoint. Please try again later.',
});
exports.RateLimitStrict = RateLimitStrict;
const RateLimitModerate = () => (0, exports.RateLimit)('moderate');
exports.RateLimitModerate = RateLimitModerate;
const RateLimitLenient = () => (0, exports.RateLimit)('lenient');
exports.RateLimitLenient = RateLimitLenient;
//# sourceMappingURL=rate-limit.guard.js.map