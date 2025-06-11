import { Repository } from 'typeorm';
import { Asset } from './entities/asset.entity';
export declare class AssetsService {
    private readonly assetRepository;
    constructor(assetRepository: Repository<Asset>);
    findAll(): Promise<Asset[]>;
    findById(id: string): Promise<Asset | null>;
    findByAssetNumber(assetNumber: string): Promise<Asset | null>;
    create(assetData: Partial<Asset>): Promise<Asset>;
    update(id: string, updateData: Partial<Asset>): Promise<Asset>;
    delete(id: string): Promise<void>;
    findByCategory(category: string): Promise<Asset[]>;
    findByLocation(location: string): Promise<Asset[]>;
    findMaintenanceDue(): Promise<Asset[]>;
    seedSampleAssets(): Promise<Asset[]>;
    private generateAssetNumber;
}
