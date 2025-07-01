import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    message?: string;
}
declare const DEFAULT_RATE_LIMITS: {
    strict: {
        windowMs: number;
        maxRequests: number;
    };
    moderate: {
        windowMs: number;
        maxRequests: number;
    };
    lenient: {
        windowMs: number;
        maxRequests: number;
    };
};
export declare const RateLimit: (config: keyof typeof DEFAULT_RATE_LIMITS | RateLimitConfig) => import("@nestjs/common").CustomDecorator<string>;
export declare class RateLimitGuard implements CanActivate {
    private reflector;
    private readonly rateLimitStore;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getClientIdentifier;
    private cleanupExpiredEntries;
}
export declare const RateLimitStrict: () => import("@nestjs/common").CustomDecorator<string>;
export declare const RateLimitModerate: () => import("@nestjs/common").CustomDecorator<string>;
export declare const RateLimitLenient: () => import("@nestjs/common").CustomDecorator<string>;
export {};
