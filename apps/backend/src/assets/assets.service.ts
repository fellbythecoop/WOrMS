import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset, AssetCategory, AssetStatus } from './entities/asset.entity';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
  ) {}

  async findAll(): Promise<Asset[]> {
    return this.assetRepository.find({
      relations: ['workOrders'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Asset | null> {
    return this.assetRepository.findOne({
      where: { id },
      relations: ['workOrders'],
    });
  }

  async findByAssetNumber(assetNumber: string): Promise<Asset | null> {
    return this.assetRepository.findOne({ where: { assetNumber } });
  }

  async create(assetData: Partial<Asset>): Promise<Asset> {
    // Generate asset number if not provided
    if (!assetData.assetNumber) {
      assetData.assetNumber = await this.generateAssetNumber();
    }

    const asset = this.assetRepository.create(assetData);
    return this.assetRepository.save(asset);
  }

  async update(id: string, updateData: Partial<Asset>): Promise<Asset> {
    await this.assetRepository.update(id, updateData);
    const updatedAsset = await this.findById(id);
    if (!updatedAsset) {
      throw new Error('Asset not found');
    }
    return updatedAsset;
  }

  async delete(id: string): Promise<void> {
    const result = await this.assetRepository.delete(id);
    if (result.affected === 0) {
      throw new Error('Asset not found');
    }
  }

  async findByCategory(category: string): Promise<Asset[]> {
    return this.assetRepository.find({
      where: { category: category as any },
      order: { name: 'ASC' },
    });
  }

  async findByLocation(location: string): Promise<Asset[]> {
    return this.assetRepository.find({
      where: { location },
      order: { name: 'ASC' },
    });
  }

  async findMaintenanceDue(): Promise<Asset[]> {
    const today = new Date();
    return this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.nextMaintenanceDate <= :today', { today })
      .orderBy('asset.nextMaintenanceDate', 'ASC')
      .getMany();
  }

  async seedSampleAssets(): Promise<Asset[]> {
    // Check if assets already exist
    const existingAssets = await this.assetRepository.count();
    if (existingAssets > 0) {
      return this.findAll();
    }

    const sampleAssets = [
      {
        name: 'Main Conference Room Projector',
        description: 'High-definition projector for presentations and meetings',
        category: AssetCategory.EQUIPMENT,
        status: AssetStatus.ACTIVE,
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
        category: AssetCategory.FACILITY,
        status: AssetStatus.ACTIVE,
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
        category: AssetCategory.EQUIPMENT,
        status: AssetStatus.ACTIVE,
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
        category: AssetCategory.IT,
        status: AssetStatus.MAINTENANCE,
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

  private async generateAssetNumber(): Promise<string> {
    const count = await this.assetRepository.count();
    const year = new Date().getFullYear();
    return `AST-${year}-${String(count + 1).padStart(4, '0')}`;
  }
} 