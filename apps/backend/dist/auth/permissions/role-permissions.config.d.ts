import { UserRole } from '../../users/entities/user.entity';
import { Permission } from './permissions.enum';
export declare const ROLE_PERMISSIONS: Record<UserRole, Permission[]>;
export declare function hasPermission(userRole: UserRole, permission: Permission): boolean;
export declare function getUserPermissions(userRole: UserRole): Permission[];
