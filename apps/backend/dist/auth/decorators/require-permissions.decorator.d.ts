import { Permission } from '../permissions/permissions.enum';
export declare const REQUIRE_PERMISSIONS_KEY = "permissions";
export declare const RequirePermissions: (...permissions: Permission[]) => import("@nestjs/common").CustomDecorator<string>;
