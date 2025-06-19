import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { DevAuthGuard } from '../auth/guards/dev-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions/permissions.enum';
import { User, UserRole } from './entities/user.entity';

@ApiTags('Users')
@Controller('users')
@UseGuards(DevAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions(Permission.VIEW_USERS)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_USERS)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  @Post()
  @RequirePermissions(Permission.CREATE_USERS)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async create(@Body() createUserData: Partial<User>): Promise<User> {
    return this.usersService.create(createUserData);
  }

  @Put(':id')
  @RequirePermissions(Permission.UPDATE_USERS)
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param('id') id: string, @Body() updateData: Partial<User>): Promise<User> {
    return this.usersService.update(id, updateData);
  }

  @Put(':id/role')
  @RequirePermissions(Permission.MANAGE_USER_ROLES)
  @ApiOperation({ summary: 'Update user role' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateRole(@Param('id') id: string, @Body() body: { role: UserRole }): Promise<User> {
    return this.usersService.update(id, { role: body.role });
  }

  @Delete(':id')
  @RequirePermissions(Permission.DELETE_USERS)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.delete(id);
  }

  @Post('seed')
  @RequirePermissions(Permission.CREATE_USERS)
  @ApiOperation({ summary: 'Seed sample users for development' })
  @ApiResponse({ status: 201, description: 'Sample users created successfully' })
  async seedSampleUsers(): Promise<User[]> {
    return this.usersService.seedSampleUsers();
  }

  @Get('roles/technicians')
  @RequirePermissions(Permission.VIEW_USERS)
  @ApiOperation({ summary: 'Get all technicians' })
  @ApiResponse({ status: 200, description: 'Technicians retrieved successfully' })
  async getTechnicians(): Promise<User[]> {
    return this.usersService.findByRole(UserRole.TECHNICIAN);
  }

  @Get('roles/managers')
  @RequirePermissions(Permission.VIEW_USERS)
  @ApiOperation({ summary: 'Get all managers' })
  @ApiResponse({ status: 200, description: 'Managers retrieved successfully' })
  async getManagers(): Promise<User[]> {
    return this.usersService.findByRole(UserRole.MANAGER);
  }
} 