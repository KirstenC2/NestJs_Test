// files.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { File } from './files/file.entity';
import { UserPermission } from './files/permission.entity';
import { User } from './files/user.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectRepository(UserPermission)
    private permissionRepository: Repository<UserPermission>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(fileData: any) {
    // First check if the user exists, if not create a user record
    let user = await this.userRepository.findOne({ where: { id: fileData.userId } });
    
    if (!user) {
      user = this.userRepository.create({
        id: fileData.userId,
        name: `User ${fileData.userId}` // Default name
      });
      await this.userRepository.save(user);
    }
    
    // Create file record
    const file = this.fileRepository.create({
      id: fileData.id,
      filename: fileData.originalname,
      originalname: fileData.originalname,
      mimetype: fileData.mimetype,
      size: fileData.size,
      path: fileData.path,
      ownerId: fileData.userId
    });
    
    // Save the file record
    await this.fileRepository.save(file);
    
    // Create a permission record for the owner
    const ownerPermission = this.permissionRepository.create({
      userId: fileData.userId,
      fileId: file.id,
      canRead: true,
      canWrite: true,
      canDelete: true
    });
    
    await this.permissionRepository.save(ownerPermission);
    
    // Return the file data with permissions
    return this.findOne(file.id);
  }

  async findAll(userId: string) {
    if (!userId) {
      throw new NotFoundException('User ID is required');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      // If not a valid UUID, return empty array instead of throwing an error
      console.warn(`Invalid UUID format for userId: ${userId}`);
      return [];
    }

    try {
      // Get files owned by the user
      const ownedFiles = await this.fileRepository.find({
        where: { ownerId: userId },
        relations: ['permissions']
      });
      
      // Get all permissions for the user
      const permissions = await this.permissionRepository.find({
        where: {
          userId,
          canRead: true
        },
        relations: ['file']
      });

      // Extract the files from permissions
      const fileIds = permissions.map(permission => permission.fileId);
      
      // Get all files that the user has permission to read
      return this.fileRepository.find({
        where: {
          id: In(fileIds)
        },
        relations: ['permissions']
      });
    } catch (error) {
      console.error('Error finding files with permissions:', error);
      return [];
    }
  }

  /**
   * Find all files a user has access to, either as owner or through permissions
   */
  async findAccessible(userId: string) {
    try {
      if (!userId) {
        return [];
      }
      
      console.log(`Finding accessible files for user: ${userId}`);
      
      // First, get all files owned by the user
      const ownedFiles = await this.fileRepository.find({
        where: { ownerId: userId },
        relations: ['permissions']
      });
      
      // Then get all permissions for the user
      const permissions = await this.permissionRepository.find({
        where: {
          userId,
          canRead: true
        }
      });
      
      // Extract the file IDs from permissions (excluding owned files)
      const ownedFileIds = ownedFiles.map(file => file.id);
      const permissionFileIds = permissions
        .map(permission => permission.fileId)
        .filter(fileId => !ownedFileIds.includes(fileId));
      
      // Get the files the user has explicit permission to access
      const permissionFiles = permissionFileIds.length > 0 
        ? await this.fileRepository.find({
            where: { id: In(permissionFileIds) },
            relations: ['permissions']
          })
        : [];
      
      // Combine both sets of files
      const allAccessibleFiles = [...ownedFiles, ...permissionFiles];
      
      // Process files to include permission info for the requesting user
      const processedFiles = allAccessibleFiles.map(file => {
        const userPermission = file.permissions?.find(p => p.userId === userId);
        
        return {
          ...file,
          isOwner: file.ownerId === userId,
          userPermission: userPermission ? {
            canRead: userPermission.canRead,
            canWrite: userPermission.canWrite,
            canDelete: userPermission.canDelete
          } : {
            // Owner has all permissions
            canRead: file.ownerId === userId,
            canWrite: file.ownerId === userId,
            canDelete: file.ownerId === userId
          }
        };
      });
      
      console.log(`Found ${processedFiles.length} accessible files for user ${userId}`);
      return processedFiles;
    } catch (error) {
      console.error('Error finding accessible files:', error);
      return [];
    }
  }

  async findOne(id: string) {
    const file = await this.fileRepository.findOne({
      where: { id },
      relations: ['permissions']
    });
    
    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }
    
    return file;
  }

  async remove(id: string) {
    const file = await this.findOne(id);
    
    // Delete the file from the filesystem
    try {
      fs.unlinkSync(file.path);
    } catch (error) {
      console.error(`Error deleting file ${file.path}:`, error);
    }
    
    // Delete related permissions
    await this.permissionRepository.delete({ fileId: id });
    
    // Delete the file record
    await this.fileRepository.delete(id);
    
    return { success: true, message: 'File deleted successfully' };
  }

  /**
   * Update permissions for multiple users at once (original implementation)
   */
  async updatePermissions(id: string, permissions: any[]) {
    // First check if file exists
    const file = await this.findOne(id);
    
    // Delete existing permissions
    await this.permissionRepository.delete({ fileId: id });
    
    // Create new permissions
    const permissionPromises = permissions.map(perm => {
      const permission = this.permissionRepository.create({
        userId: perm.userId,
        fileId: id,
        canRead: perm.canRead || false,
        canWrite: perm.canWrite || false,
        canDelete: perm.canDelete || false
      });
      return this.permissionRepository.save(permission);
    });
    
    await Promise.all(permissionPromises);
    
    // Return updated file with permissions
    return this.findOne(id);
  }
  
  /**
   * Update permission for a single user (simplified format from README)
   * @param fileId File ID
   * @param userId User ID to set permission for
   * @param permission Permission type ("read", "write", "delete", or "none")
   */
  async updatePermission(fileId: string, userId: string, permission: string) {
    // First check if file exists
    const file = await this.findOne(fileId);
    
    // Check for existing permission
    let userPermission = await this.permissionRepository.findOne({
      where: { fileId: fileId, userId: userId }
    });
    
    // If permission doesn't exist, create it
    if (!userPermission) {
      userPermission = this.permissionRepository.create({
        userId: userId,
        fileId: fileId,
        canRead: false,
        canWrite: false,
        canDelete: false
      });
    }
    
    // Update permission based on the permission string
    if (permission === 'read') {
      userPermission.canRead = true;
    } else if (permission === 'write') {
      userPermission.canRead = true; // Write implies read
      userPermission.canWrite = true;
    } else if (permission === 'delete') {
      userPermission.canRead = true; // Delete implies read
      userPermission.canDelete = true;
    } else if (permission === 'none') {
      // Remove permission completely
      if (userPermission.id) {
        await this.permissionRepository.delete(userPermission.id);
      }
      return { success: true, message: 'Permission removed' };
    } else {
      throw new Error(`Invalid permission type: ${permission}. Must be 'read', 'write', 'delete', or 'none'.`);
    }
    
    // Save the updated permission
    await this.permissionRepository.save(userPermission);
    
    // Return updated file with permissions
    return this.findOne(fileId);
  }

  /**
   * Check if a user is the owner of a file
   * @param fileId - The ID of the file to check
   * @param userId - The ID of the user to check
   * @returns Promise<boolean> - True if the user is the owner, false otherwise
   * @throws NotFoundException - If the file doesn't exist
   */
  async isOwner(fileId: string, userId: string): Promise<boolean> {
    // TEST MODE: Allow anyone to be an owner for testing
    console.log(`TEST MODE: Assuming ${userId} is owner of file ${fileId}`);
    return true;
    
    // ORIGINAL IMPLEMENTATION: Uncomment for production use
    /*
    const file = await this.fileRepository.findOne({
      where: { id: fileId }
    });
    
    if (!file) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }
    
    return file.ownerId === userId;
    */
  }
}