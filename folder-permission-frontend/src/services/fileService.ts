import api from './api';

// File type definition - rename to avoid conflict with browser's File type
export interface FileRecord {
  id: string;
  originalname: string;
  filename?: string;
  mimetype: string;
  size: number;
  path?: string;
  uploadDate: string;
  userId: string;
  permissions: Permission[];
}

// Permission type definition
export interface Permission {
  userId: string;
  userType: 'user' | 'group';
  accessLevel: 'read' | 'write' | 'delete';
}

// Service for handling file operations
export const fileService = {
  // Get all files
  async getFiles(): Promise<FileRecord[]> {
    const response = await api.get('/files');
    return response.data;
  },

  // Get a specific file by ID
  async getFile(id: string): Promise<FileRecord> {
    const response = await api.get(`/files/${id}`);
    return response.data;
  },

  // Upload a file using FormData and Multer
  async uploadFile(fileMetadata: Partial<FileRecord>, actualFile: Blob | globalThis.File): Promise<FileRecord> {
    const formData = new FormData();
    formData.append('file', actualFile);
    
    if (fileMetadata.userId) {
      formData.append('userId', fileMetadata.userId);
    }
    
    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Download a file
  async downloadFile(id: string): Promise<Blob> {
    const response = await api.get(`/files/download/${id}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Create a new file (metadata only)
  async createFile(file: Omit<FileRecord, 'id'>): Promise<FileRecord> {
    const response = await api.post('/files', file);
    return response.data;
  },

  // Delete a file by ID
  async deleteFile(id: string): Promise<void> {
    await api.delete(`/files/${id}`);
  },

  // Update permissions for a file
  async updatePermissions(id: string, permissions: Permission[]): Promise<FileRecord> {
    const response = await api.post(`/files/${id}/permissions`, { permissions });
    return response.data;
  }
};

export default fileService
