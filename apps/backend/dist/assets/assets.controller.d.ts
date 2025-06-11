import { AssetsService } from './assets.service';
import { Asset } from './entities/asset.entity';
export declare class AssetsController {
    private readonly assetsService;
    constructor(assetsService: AssetsService);
    findAll(): Promise<Asset[]>;
    findOne(id: string): Promise<Asset>;
    create(createAssetData: Partial<Asset>): Promise<Asset>;
    update(id: string, updateData: Partial<Asset>): Promise<Asset>;
    remove(id: string): Promise<void>;
    seedSampleAssets(): Promise<Asset[]>;
}
