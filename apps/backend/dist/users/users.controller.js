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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const dev_auth_guard_1 = require("../auth/guards/dev-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const require_permissions_decorator_1 = require("../auth/decorators/require-permissions.decorator");
const permissions_enum_1 = require("../auth/permissions/permissions.enum");
const user_entity_1 = require("./entities/user.entity");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async findAll() {
        return this.usersService.findAll();
    }
    async findOne(id) {
        const user = await this.usersService.findById(id);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
    async create(createUserData) {
        return this.usersService.create(createUserData);
    }
    async update(id, updateData) {
        return this.usersService.update(id, updateData);
    }
    async updateRole(id, body) {
        return this.usersService.update(id, { role: body.role });
    }
    async remove(id) {
        return this.usersService.delete(id);
    }
    async seedSampleUsers() {
        return this.usersService.seedSampleUsers();
    }
    async getTechnicians() {
        return this.usersService.findByRole(user_entity_1.UserRole.TECHNICIAN);
    }
    async getManagers() {
        return this.usersService.findByRole(user_entity_1.UserRole.MANAGER);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.VIEW_USERS),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Users retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.VIEW_USERS),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.CREATE_USERS),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new user' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.UPDATE_USERS),
    (0, swagger_1.ApiOperation)({ summary: 'Update user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/role'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.MANAGE_USER_ROLES),
    (0, swagger_1.ApiOperation)({ summary: 'Update user role' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User role updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.DELETE_USERS),
    (0, swagger_1.ApiOperation)({ summary: 'Delete user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('seed'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.CREATE_USERS),
    (0, swagger_1.ApiOperation)({ summary: 'Seed sample users for development' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Sample users created successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "seedSampleUsers", null);
__decorate([
    (0, common_1.Get)('roles/technicians'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.VIEW_USERS),
    (0, swagger_1.ApiOperation)({ summary: 'Get all technicians' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Technicians retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getTechnicians", null);
__decorate([
    (0, common_1.Get)('roles/managers'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_enum_1.Permission.VIEW_USERS),
    (0, swagger_1.ApiOperation)({ summary: 'Get all managers' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Managers retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getManagers", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(dev_auth_guard_1.DevAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map