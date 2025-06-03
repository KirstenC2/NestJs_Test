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
    // Get the required permission from the route handler metadata
    const requiredPermission = this.reflector.getAllAndOverride<PermissionType>(
      PERMISSION_KEY, 
      [
        context.getHandler(),
        context.getClass(),
      ]
    );

    // If no permission is required, allow access
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Check if user is authenticated
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Extract fileId from request params, query, or body
    const fileId = request.params.id || request.query.fileId || request.body.fileId;
    
    if (!fileId) {
      return true; // If no fileId is provided, allow access (might be a general endpoint)
    }

    try {
      // Check if user is the owner of the file
      if (requiredPermission === 'owner') {
        const isOwner = this.filesService.isOwner(fileId, user.id);
        if (!isOwner) {
          throw new ForbiddenException('User is not the owner of this file');
        }
        return true;
      }

      // Check if user has explicit permission for this file
      // First, retrieve the file to check its permissions
      const file = this.filesService.findOne(fileId);
      
      // Check if user is the owner (owners have all permissions)
      if (file.userId === user.id) {
        return true;
      }
      
      // Check user's explicit permissions
      const userPermission = file.permissions?.find(
        permission => permission.userId === user.id && permission.userType === 'user'
      );

      if (!userPermission) {
        throw new ForbiddenException('User does not have permission to access this file');
      }

      // Check if user has sufficient permission level
      const permissionLevels: Record<string, number> = {
        'read': 1,
        'write': 2,
        'delete': 3,
      };

      const requiredLevel = permissionLevels[requiredPermission];
      const userLevel = permissionLevels[userPermission.accessLevel];

      if (userLevel >= requiredLevel) {
        return true;
      } else {
        throw new ForbiddenException(`User has '${userPermission.accessLevel}' permission but '${requiredPermission}' is required`);
      }
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }
      // If file not found or other error
      throw new ForbiddenException('Error checking permissions');
    }
  }
}
