export declare class CacheService {
    private readonly logger;
    private readonly cache;
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    clear(): Promise<void>;
    getDashboardStatsKey(): string;
    getWorkOrdersKey(filters?: Record<string, any>): string;
    getUsersKey(): string;
    getWorkOrderKey(id: string): string;
    invalidateWorkOrderCaches(): Promise<void>;
    invalidateUserCaches(): Promise<void>;
}
