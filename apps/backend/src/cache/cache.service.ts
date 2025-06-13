import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly cache = new Map<string, { value: any; expiry: number }>();

  // Simple in-memory cache implementation for development
  // In production, this would use Redis
  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    this.logger.debug(`Cache HIT for key: ${key}`);
    return item.value as T;
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiry });
    this.logger.debug(`Cache SET for key: ${key}, TTL: ${ttlSeconds}s`);
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
    this.logger.debug(`Cache DELETE for key: ${key}`);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.logger.debug('Cache CLEARED');
  }

  // Cache key generators
  getDashboardStatsKey(): string {
    return 'dashboard:stats';
  }

  getWorkOrdersKey(filters?: Record<string, any>): string {
    const filterStr = filters ? JSON.stringify(filters) : 'all';
    return `work-orders:${Buffer.from(filterStr).toString('base64')}`;
  }

  getUsersKey(): string {
    return 'users:all';
  }

  getWorkOrderKey(id: string): string {
    return `work-order:${id}`;
  }

  // Invalidation helpers
  async invalidateWorkOrderCaches(): Promise<void> {
    const keysToDelete: string[] = [];
    
    // Find all work order related cache keys
    for (const [key] of this.cache) {
      if (key.startsWith('work-orders:') || 
          key.startsWith('work-order:') || 
          key === 'dashboard:stats') {
        keysToDelete.push(key);
      }
    }

    // Delete all found keys
    for (const key of keysToDelete) {
      await this.del(key);
    }

    this.logger.debug(`Invalidated ${keysToDelete.length} work order cache keys`);
  }

  async invalidateUserCaches(): Promise<void> {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.cache) {
      if (key.startsWith('users:')) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      await this.del(key);
    }

    this.logger.debug(`Invalidated ${keysToDelete.length} user cache keys`);
  }
} 