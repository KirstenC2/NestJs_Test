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
}