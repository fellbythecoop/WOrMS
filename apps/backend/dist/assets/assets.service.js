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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const asset_entity_1 = require("./entities/asset.entity");
let AssetsService = class AssetsService {
    constructor(assetRepository) {
        this.assetRepository = assetRepository;
    }
    async findAll() {
        return this.assetRepository.find({
            relations: ['workOrders'],
            order: { createdAt: 'DESC' },
        });
    }
    async findById(id) {
        return this.assetRepository.findOne({
            where: { id },
            relations: ['workOrders'],
        });
    }
    async findByAssetNumber(assetNumber) {
        return this.assetRepository.findOne({ where: { assetNumber } });
    }
    async create(assetData) {
        if (!assetData.assetNumber) {
            assetData.assetNumber = await this.generateAssetNumber();
        }
        const asset = this.assetRepository.create(assetData);
        return this.assetRepository.save(asset);
    }
    async update(id, updateData) {
        await this.assetRepository.update(id, updateData);
        const updatedAsset = await this.findById(id);
        if (!updatedAsset) {
            throw new Error('Asset not found');
        }
        return updatedAsset;
    }
    async delete(id) {
        const result = await this.assetRepository.delete(id);
        if (result.affected === 0) {
            throw new Error('Asset not found');
        }
    }
    async findByCategory(category) {
        return this.assetRepository.find({
            where: { category: category },
            order: { name: 'ASC' },
        });
    }
    async findByLocation(location) {
        return this.assetRepository.find({
            where: { location },
            order: { name: 'ASC' },
        });
    }
    async findMaintenanceDue() {
        const today = new Date();
        return this.assetRepository
            .createQueryBuilder('asset')
            .where('asset.nextMaintenanceDate <= :today', { today })
            .orderBy('asset.nextMaintenanceDate', 'ASC')
            .getMany();
    }
    async seedSampleAssets() {
        const existingAssets = await this.assetRepository.count();
        if (existingAssets > 0) {
            return this.findAll();
        }
        const sampleAssets = [
            {
                name: 'Main Conference Room Projector',
                description: 'High-definition projector for presentations and meetings',
                category: asset_entity_1.AssetCategory.EQUIPMENT,
                status: asset_entity_1.AssetStatus.ACTIVE,
                manufacturer: 'Epson',
                model: 'EX3280',
                serialNumber: 'EP123456789',
                location: 'Conference Room A',
                department: 'IT',
                purchasePrice: 599.99,
                purchaseDate: new Date('2023-01-15'),
                warrantyExpiration: new Date('2026-01-15'),
                nextMaintenanceDate: new Date('2024-07-01'),
            },
            {
                name: 'Server Room AC Unit',
                description: 'Primary air conditioning unit for server room cooling',
                category: asset_entity_1.AssetCategory.FACILITY,
                status: asset_entity_1.AssetStatus.ACTIVE,
                manufacturer: 'Carrier',
                model: 'AC-5000',
                serialNumber: 'CA987654321',
                location: 'Server Room',
                department: 'Facilities',
                purchasePrice: 3500.00,
                purchaseDate: new Date('2022-03-10'),
                warrantyExpiration: new Date('2027-03-10'),
                lastMaintenanceDate: new Date('2024-11-01'),
                nextMaintenanceDate: new Date('2025-02-01'),
            },
            {
                name: 'Employee Parking Lot Camera #3',
                description: 'Security camera monitoring employee parking area',
                category: asset_entity_1.AssetCategory.EQUIPMENT,
                status: asset_entity_1.AssetStatus.ACTIVE,
                manufacturer: 'Hikvision',
                model: 'DS-2CD2085FWD-I',
                serialNumber: 'HK555666777',
                location: 'Parking Lot',
                department: 'Security',
                purchasePrice: 199.99,
                purchaseDate: new Date('2023-06-20'),
                warrantyExpiration: new Date('2025-06-20'),
            },
            {
                name: 'Reception Desk Phone System',
                description: 'Multi-line phone system for reception area',
                category: asset_entity_1.AssetCategory.IT,
                status: asset_entity_1.AssetStatus.MAINTENANCE,
                manufacturer: 'Cisco',
                model: 'CP-7965G',
                serialNumber: 'CS111222333',
                location: 'Reception',
                department: 'IT',
                purchasePrice: 450.00,
                purchaseDate: new Date('2021-09-05'),
                warrantyExpiration: new Date('2024-09-05'),
                nextMaintenanceDate: new Date('2024-12-20'),
            },
        ];
        const assets = [];
        for (const assetData of sampleAssets) {
            const asset = await this.create(assetData);
            assets.push(asset);
        }
        return assets;
    }
    async generateAssetNumber() {
        const count = await this.assetRepository.count();
        const year = new Date().getFullYear();
        return `AST-${year}-${String(count + 1).padStart(4, '0')}`;
    }
};
exports.AssetsService = AssetsService;
exports.AssetsService = AssetsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(asset_entity_1.Asset)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AssetsService);
//# sourceMappingURL=assets.service.js.map