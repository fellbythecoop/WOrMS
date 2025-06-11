import { WorkOrder } from '../../work-orders/entities/work-order.entity';
export declare enum AssetStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    MAINTENANCE = "maintenance",
    RETIRED = "retired"
}
export declare enum AssetCategory {
    EQUIPMENT = "equipment",
    FACILITY = "facility",
    VEHICLE = "vehicle",
    IT = "it",
    FURNITURE = "furniture",
    OTHER = "other"
}
export declare class Asset {
    id: string;
    assetNumber: string;
    name: string;
    description?: string;
    category: AssetCategory;
    status: AssetStatus;
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    location?: string;
    department?: string;
    purchasePrice?: number;
    purchaseDate?: Date;
    warrantyExpiration?: Date;
    lastMaintenanceDate?: Date;
    nextMaintenanceDate?: Date;
    specifications?: string;
    imageUrls?: string;
    createdAt: Date;
    updatedAt: Date;
    workOrders: WorkOrder[];
    get isUnderWarranty(): boolean;
    get isMaintenanceDue(): boolean;
    get age(): number;
}
