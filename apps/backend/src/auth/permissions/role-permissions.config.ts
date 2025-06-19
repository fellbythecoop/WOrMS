import { UserRole } from '../../users/entities/user.entity';
import { Permission } from './permissions.enum';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMINISTRATOR]: [
    // Full system access
    Permission.VIEW_USERS,
    Permission.CREATE_USERS,
    Permission.UPDATE_USERS,
    Permission.DELETE_USERS,
    Permission.MANAGE_USER_ROLES,
    Permission.VIEW_ALL_WORK_ORDERS,
    Permission.CREATE_WORK_ORDERS,
    Permission.UPDATE_WORK_ORDERS,
    Permission.DELETE_WORK_ORDERS,
    Permission.ASSIGN_WORK_ORDERS,
    Permission.VIEW_ASSETS,
    Permission.CREATE_ASSETS,
    Permission.UPDATE_ASSETS,
    Permission.DELETE_ASSETS,
    Permission.VIEW_COMMENTS,
    Permission.CREATE_COMMENTS,
    Permission.DELETE_ANY_COMMENTS,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.EXPORT_DATA,
    Permission.VIEW_SYSTEM_HEALTH,
    Permission.MANAGE_SYSTEM_SETTINGS,
    Permission.VIEW_AUDIT_LOGS,
  ],

  [UserRole.MANAGER]: [
    // Management level access
    Permission.VIEW_USERS,
    Permission.VIEW_ALL_WORK_ORDERS,
    Permission.CREATE_WORK_ORDERS,
    Permission.UPDATE_WORK_ORDERS,
    Permission.ASSIGN_WORK_ORDERS,
    Permission.VIEW_ASSETS,
    Permission.CREATE_ASSETS,
    Permission.UPDATE_ASSETS,
    Permission.VIEW_COMMENTS,
    Permission.CREATE_COMMENTS,
    Permission.DELETE_ANY_COMMENTS,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.EXPORT_DATA,
  ],

  [UserRole.TECHNICIAN]: [
    // Technician specific access
    Permission.VIEW_WORK_ORDERS,
    Permission.UPDATE_OWN_WORK_ORDERS,
    Permission.VIEW_ASSETS,
    Permission.VIEW_COMMENTS,
    Permission.CREATE_COMMENTS,
    Permission.UPDATE_OWN_COMMENTS,
    Permission.DELETE_OWN_COMMENTS,
    Permission.VIEW_REPORTS,
  ],

  [UserRole.REQUESTER]: [
    // Basic requester access
    Permission.CREATE_WORK_ORDERS,
    Permission.VIEW_WORK_ORDERS, // Only their own work orders
    Permission.VIEW_ASSETS,
    Permission.VIEW_COMMENTS,
    Permission.CREATE_COMMENTS,
    Permission.UPDATE_OWN_COMMENTS,
    Permission.DELETE_OWN_COMMENTS,
  ],
};

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions ? rolePermissions.includes(permission) : false;
}

export function getUserPermissions(userRole: UserRole): Permission[] {
  return ROLE_PERMISSIONS[userRole] || [];
} 