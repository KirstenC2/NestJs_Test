import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FilesService } from '../app.service';
import { PERMISSION_KEY, PermissionType } from '../decorators/permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private filesService: FilesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>('permission', context.getHandler());

    // If no permission is required for this route, allow access
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    // If no user is found in the request (AuthMiddleware didn't run or set the user), deny access
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // If there's no file ID in the params, we can't check permissions on a specific file
    const fileId = request.params.id;
    if (!fileId) {
      return true; // No specific file, allow access (e.g., for listing files)
    }

    try {
      // Check if the user is the owner of the file
      const isOwner = await this.filesService.isOwner(fileId, user.id);

      // Owner-only routes
      if (requiredPermission === 'owner') {
        if (isOwner) {
          return true;
        } else {
          throw new ForbiddenException('Only the file owner can perform this action');
        }
      }

      // If they're the owner, they have all permissions
      if (isOwner) {
        return true;
      }

      // For regular permissions (read, write, delete), check if the user has that permission on the file
      const file = await this.filesService.findOne(fileId);
      
      // Find the user's permission for this file
      const userPermission = file.permissions?.find(perm => perm.userId === user.id);

      if (!userPermission) {
        throw new ForbiddenException(`You don't have ${requiredPermission} permission for this file`);
      }

      // Check if the user has the required permission
      switch (requiredPermission) {
        case 'read':
          if (userPermission.canRead) {
            return true;
          }
          break;
        case 'write':
          if (userPermission.canWrite) {
            return true;
          }
          break;
        case 'delete':
          if (userPermission.canDelete) {
            return true;
          }
          break;
      }

      // If the user doesn't have the required permission, deny access
      throw new ForbiddenException(`You don't have ${requiredPermission} permission for this file`);
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      // If the file is not found or other errors occur, deny access
      throw new ForbiddenException('Unable to verify permissions');
    }
  }
}
