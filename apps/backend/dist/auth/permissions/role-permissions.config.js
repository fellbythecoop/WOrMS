"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = void 0;
exports.hasPermission = hasPermission;
exports.getUserPermissions = getUserPermissions;
const user_entity_1 = require("../../users/entities/user.entity");
const permissions_enum_1 = require("./permissions.enum");
exports.ROLE_PERMISSIONS = {
    [user_entity_1.UserRole.ADMINISTRATOR]: [
        permissions_enum_1.Permission.VIEW_USERS,
        permissions_enum_1.Permission.CREATE_USERS,
        permissions_enum_1.Permission.UPDATE_USERS,
        permissions_enum_1.Permission.DELETE_USERS,
        permissions_enum_1.Permission.MANAGE_USER_ROLES,
        permissions_enum_1.Permission.VIEW_ALL_WORK_ORDERS,
        permissions_enum_1.Permission.CREATE_WORK_ORDERS,
        permissions_enum_1.Permission.UPDATE_WORK_ORDERS,
        permissions_enum_1.Permission.DELETE_WORK_ORDERS,
        permissions_enum_1.Permission.ASSIGN_WORK_ORDERS,
        permissions_enum_1.Permission.VIEW_ASSETS,
        permissions_enum_1.Permission.CREATE_ASSETS,
        permissions_enum_1.Permission.UPDATE_ASSETS,
        permissions_enum_1.Permission.DELETE_ASSETS,
        permissions_enum_1.Permission.VIEW_COMMENTS,
        permissions_enum_1.Permission.CREATE_COMMENTS,
        permissions_enum_1.Permission.DELETE_ANY_COMMENTS,
        permissions_enum_1.Permission.VIEW_SCHEDULES,
        permissions_enum_1.Permission.CREATE_SCHEDULES,
        permissions_enum_1.Permission.UPDATE_SCHEDULES,
        permissions_enum_1.Permission.DELETE_SCHEDULES,
        permissions_enum_1.Permission.MANAGE_SCHEDULES,
        permissions_enum_1.Permission.VIEW_UTILIZATION,
        permissions_enum_1.Permission.VIEW_REPORTS,
        permissions_enum_1.Permission.GENERATE_REPORTS,
        permissions_enum_1.Permission.EXPORT_DATA,
        permissions_enum_1.Permission.VIEW_SYSTEM_HEALTH,
        permissions_enum_1.Permission.MANAGE_SYSTEM_SETTINGS,
        permissions_enum_1.Permission.VIEW_AUDIT_LOGS,
    ],
    [user_entity_1.UserRole.MANAGER]: [
        permissions_enum_1.Permission.VIEW_USERS,
        permissions_enum_1.Permission.VIEW_ALL_WORK_ORDERS,
        permissions_enum_1.Permission.CREATE_WORK_ORDERS,
        permissions_enum_1.Permission.UPDATE_WORK_ORDERS,
        permissions_enum_1.Permission.ASSIGN_WORK_ORDERS,
        permissions_enum_1.Permission.VIEW_ASSETS,
        permissions_enum_1.Permission.CREATE_ASSETS,
        permissions_enum_1.Permission.UPDATE_ASSETS,
        permissions_enum_1.Permission.VIEW_COMMENTS,
        permissions_enum_1.Permission.CREATE_COMMENTS,
        permissions_enum_1.Permission.DELETE_ANY_COMMENTS,
        permissions_enum_1.Permission.VIEW_SCHEDULES,
        permissions_enum_1.Permission.CREATE_SCHEDULES,
        permissions_enum_1.Permission.UPDATE_SCHEDULES,
        permissions_enum_1.Permission.MANAGE_SCHEDULES,
        permissions_enum_1.Permission.VIEW_UTILIZATION,
        permissions_enum_1.Permission.VIEW_REPORTS,
        permissions_enum_1.Permission.GENERATE_REPORTS,
        permissions_enum_1.Permission.EXPORT_DATA,
    ],
    [user_entity_1.UserRole.TECHNICIAN]: [
        permissions_enum_1.Permission.VIEW_WORK_ORDERS,
        permissions_enum_1.Permission.UPDATE_OWN_WORK_ORDERS,
        permissions_enum_1.Permission.VIEW_ASSETS,
        permissions_enum_1.Permission.VIEW_COMMENTS,
        permissions_enum_1.Permission.CREATE_COMMENTS,
        permissions_enum_1.Permission.UPDATE_OWN_COMMENTS,
        permissions_enum_1.Permission.DELETE_OWN_COMMENTS,
        permissions_enum_1.Permission.VIEW_SCHEDULES,
        permissions_enum_1.Permission.VIEW_REPORTS,
    ],
    [user_entity_1.UserRole.REQUESTER]: [
        permissions_enum_1.Permission.CREATE_WORK_ORDERS,
        permissions_enum_1.Permission.VIEW_WORK_ORDERS,
        permissions_enum_1.Permission.VIEW_ASSETS,
        permissions_enum_1.Permission.VIEW_COMMENTS,
        permissions_enum_1.Permission.CREATE_COMMENTS,
        permissions_enum_1.Permission.UPDATE_OWN_COMMENTS,
        permissions_enum_1.Permission.DELETE_OWN_COMMENTS,
    ],
};
function hasPermission(userRole, permission) {
    const rolePermissions = exports.ROLE_PERMISSIONS[userRole];
    return rolePermissions ? rolePermissions.includes(permission) : false;
}
function getUserPermissions(userRole) {
    return exports.ROLE_PERMISSIONS[userRole] || [];
}
//# sourceMappingURL=role-permissions.config.js.map