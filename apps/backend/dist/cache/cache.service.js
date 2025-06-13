"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
let CacheService = CacheService_1 = class CacheService {
    constructor() {
        this.logger = new common_1.Logger(CacheService_1.name);
        this.cache = new Map();
    }
    async get(key) {
        const item = this.cache.get(key);
        if (!item)
            return null;
        if (item.expiry < Date.now()) {
            this.cache.delete(key);
            return null;
        }
        this.logger.debug(`Cache HIT for key: ${key}`);
        return item.value;
    }
    async set(key, value, ttlSeconds = 300) {
        const expiry = Date.now() + (ttlSeconds * 1000);
        this.cache.set(key, { value, expiry });
        this.logger.debug(`Cache SET for key: ${key}, TTL: ${ttlSeconds}s`);
    }
    async del(key) {
        this.cache.delete(key);
        this.logger.debug(`Cache DELETE for key: ${key}`);
    }
    async clear() {
        this.cache.clear();
        this.logger.debug('Cache CLEARED');
    }
    getDashboardStatsKey() {
        return 'dashboard:stats';
    }
    getWorkOrdersKey(filters) {
        const filterStr = filters ? JSON.stringify(filters) : 'all';
        return `work-orders:${Buffer.from(filterStr).toString('base64')}`;
    }
    getUsersKey() {
        return 'users:all';
    }
    getWorkOrderKey(id) {
        return `work-order:${id}`;
    }
    async invalidateWorkOrderCaches() {
        const keysToDelete = [];
        for (const [key] of this.cache) {
            if (key.startsWith('work-orders:') ||
                key.startsWith('work-order:') ||
                key === 'dashboard:stats') {
                keysToDelete.push(key);
            }
        }
        for (const key of keysToDelete) {
            await this.del(key);
        }
        this.logger.debug(`Invalidated ${keysToDelete.length} work order cache keys`);
    }
    async invalidateUserCaches() {
        const keysToDelete = [];
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
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)()
], CacheService);
//# sourceMappingURL=cache.service.js.map