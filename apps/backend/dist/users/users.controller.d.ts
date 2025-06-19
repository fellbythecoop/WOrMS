import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User>;
    create(createUserData: Partial<User>): Promise<User>;
    update(id: string, updateData: Partial<User>): Promise<User>;
    updateRole(id: string, body: {
        role: UserRole;
    }): Promise<User>;
    remove(id: string): Promise<void>;
    seedSampleUsers(): Promise<User[]>;
    getTechnicians(): Promise<User[]>;
    getManagers(): Promise<User[]>;
}
