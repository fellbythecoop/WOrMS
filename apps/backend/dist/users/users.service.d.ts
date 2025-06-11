import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UsersService {
    private readonly userRepository;
    constructor(userRepository: Repository<User>);
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByAzureAdObjectId(azureAdObjectId: string): Promise<User | null>;
    createFromAzureAd(data: {
        azureAdObjectId: string;
        email: string;
        firstName?: string;
        lastName?: string;
    }): Promise<User>;
    findAll(): Promise<User[]>;
    update(id: string, updateData: Partial<User>): Promise<User>;
    delete(id: string): Promise<void>;
    seedSampleUsers(): Promise<User[]>;
}
