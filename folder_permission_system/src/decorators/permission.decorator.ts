import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';
export type PermissionType = 'read' | 'write' | 'delete' | 'owner';

/**
 * Set the required permission level for a route
 * @param permission - The permission required to access the route
 */
export const RequirePermission = (permission: PermissionType) => SetMetadata(PERMISSION_KEY, permission);
