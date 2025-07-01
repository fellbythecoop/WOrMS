import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

// Rate limit configuration interface
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
}

// Default rate limit configurations
const DEFAULT_RATE_LIMITS = {
  strict: { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 requests per 15 minutes
  moderate: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 requests per 15 minutes
  lenient: { windowMs: 15 * 60 * 1000, maxRequests: 1000 }, // 1000 requests per 15 minutes
};

// Metadata key for rate limiting
const RATE_LIMIT_KEY = 'rateLimit';

// Decorator for setting rate limits
export const RateLimit = (config: keyof typeof DEFAULT_RATE_LIMITS | RateLimitConfig) => {
  return SetMetadata(RATE_LIMIT_KEY, config);
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitConfig = this.reflector.get<keyof typeof DEFAULT_RATE_LIMITS | RateLimitConfig>(
      RATE_LIMIT_KEY,
      context.getHandler()
    );

    if (!rateLimitConfig) {
      return true; // No rate limit configured
    }

    const request = context.switchToHttp().getRequest<Request>();
    const clientId = this.getClientIdentifier(request);

    // Get rate limit configuration
    const config = typeof rateLimitConfig === 'string' 
      ? DEFAULT_RATE_LIMITS[rateLimitConfig] 
      : rateLimitConfig;

    const now = Date.now();
    const key = `${clientId}:${context.getHandler().name}`;
    
    // Get or create rate limit entry
    let entry = this.rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
    }

    // Increment request count
    entry.count++;
    this.rateLimitStore.set(key, entry);

    // Check if rate limit exceeded
    if (entry.count > config.maxRequests) {
      const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000);
      const message = (config as RateLimitConfig).message || 'Too many requests';
      
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message,
          error: 'Rate Limit Exceeded',
          retryAfter: resetTimeSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Add rate limit headers
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', config.maxRequests);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - entry.count));
    response.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    return true;
  }

  private getClientIdentifier(request: Request): string {
    // Priority: User ID > API Key > IP Address
    const userId = (request as any).user?.id;
    if (userId) {
      return `user:${userId}`;
    }

    const apiKey = request.headers['x-api-key'];
    if (apiKey) {
      return `api:${apiKey}`;
    }

    // Get real IP address (considering proxies)
    const forwarded = request.headers['x-forwarded-for'];
    const ip = forwarded 
      ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0])
      : request.connection.remoteAddress;

    return `ip:${ip}`;
  }

  // Cleanup expired entries periodically
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }
  }
}

// Enhanced rate limiting decorator with custom messages
export const RateLimitStrict = () => RateLimit({
  ...DEFAULT_RATE_LIMITS.strict,
  message: 'Too many requests to this sensitive endpoint. Please try again later.',
});

export const RateLimitModerate = () => RateLimit('moderate');
export const RateLimitLenient = () => RateLimit('lenient'); 