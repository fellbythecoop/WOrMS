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
exports.Asset = exports.AssetCategory = exports.AssetStatus = void 0;
const typeorm_1 = require("typeorm");
const work_order_entity_1 = require("../../work-orders/entities/work-order.entity");
var AssetStatus;
(function (AssetStatus) {
    AssetStatus["ACTIVE"] = "active";
    AssetStatus["INACTIVE"] = "inactive";
    AssetStatus["MAINTENANCE"] = "maintenance";
    AssetStatus["RETIRED"] = "retired";
})(AssetStatus || (exports.AssetStatus = AssetStatus = {}));
var AssetCategory;
(function (AssetCategory) {
    AssetCategory["EQUIPMENT"] = "equipment";
    AssetCategory["FACILITY"] = "facility";
    AssetCategory["VEHICLE"] = "vehicle";
    AssetCategory["IT"] = "it";
    AssetCategory["FURNITURE"] = "furniture";
    AssetCategory["OTHER"] = "other";
})(AssetCategory || (exports.AssetCategory = AssetCategory = {}));
let Asset = class Asset {
    get isUnderWarranty() {
        if (!this.warrantyExpiration)
            return false;
        return new Date() < this.warrantyExpiration;
    }
    get isMaintenanceDue() {
        if (!this.nextMaintenanceDate)
            return false;
        return new Date() >= this.nextMaintenanceDate;
    }
    get age() {
        if (!this.purchaseDate)
            return 0;
        const today = new Date();
        const purchase = new Date(this.purchaseDate);
        return today.getFullYear() - purchase.getFullYear();
    }
};
exports.Asset = Asset;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Asset.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Asset.prototype, "assetNumber", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Asset.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: AssetCategory.EQUIPMENT,
    }),
    __metadata("design:type", String)
], Asset.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: AssetStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], Asset.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "manufacturer", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "model", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "serialNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', nullable: true }),
    __metadata("design:type", Number)
], Asset.prototype, "purchasePrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Asset.prototype, "purchaseDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Asset.prototype, "warrantyExpiration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Asset.prototype, "lastMaintenanceDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Asset.prototype, "nextMaintenanceDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "specifications", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "imageUrls", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Asset.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Asset.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => work_order_entity_1.WorkOrder, workOrder => workOrder.asset),
    __metadata("design:type", Array)
], Asset.prototype, "workOrders", void 0);
exports.Asset = Asset = __decorate([
    (0, typeorm_1.Entity)('assets')
], Asset);
//# sourceMappingURL=asset.entity.js.map