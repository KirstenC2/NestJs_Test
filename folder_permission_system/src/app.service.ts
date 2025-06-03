// files.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { File, Permission } from './files/file.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FilesService {
  private files: File[] = [];

  create(fileData: File) {
    this.files.push(fileData);
    return fileData;
  }

  findAll() {
    return this.files.map(file => ({
      id: file.id,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      uploadDate: file.uploadDate,
      userId: file.userId,
    }));
  }

  findOne(id: string) {
    const file = this.files.find(file => file.id === id);
    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }
    return file;
  }

  remove(id: string) {
    const fileIndex = this.files.findIndex(file => file.id === id);
    if (fileIndex === -1) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }
    
    const file = this.files[fileIndex];
    
    // Delete the file from the filesystem
    try {
      fs.unlinkSync(file.path);
    } catch (error) {
      console.error(`Error deleting file ${file.path}:`, error);
    }
    
    // Remove from our in-memory array
    this.files.splice(fileIndex, 1);
    
    return { message: `File ${id} has been deleted` };
  }

  updatePermissions(id: string, permissions: Permission[]) {
    const file = this.findOne(id);
    file.permissions = permissions;
    return file;
  }

  /**
   * Check if a user is the owner of a file
   * @param fileId - The ID of the file to check
   * @param userId - The ID of the user to check
   * @returns boolean - True if the user is the owner, false otherwise
   * @throws NotFoundException - If the file doesn't exist
   */
  isOwner(fileId: string, userId: string): boolean {
    const file = this.findOne(fileId);
    return file.userId === userId;
  }
}