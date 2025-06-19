import { SetMetadata } from '@nestjs/common';
import { Permission } from '../permissions/permissions.enum';

export const REQUIRE_PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions); 