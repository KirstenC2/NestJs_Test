import api from './api';
import { useUserStore } from '../stores/userStore';

// File type definition - rename to avoid conflict with browser's File type
export interface FileRecord {
  id: string;
  originalname: string;
  filename?: string;
  mimetype: string;
  size: number;
  path?: string;
  uploadDate?: string;
  userId?: string;
  ownerId?: string;
  permissions: PermissionRecord[];
}

// Permission record from database
export interface PermissionRecord {
  id?: string;
  userId: string;
  fileId: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

// Simple permission type for API requests
export interface PermissionRequest {
  userId: string;
  permission: 'read' | 'write' | 'delete' | 'none';
}

// Service for handling file operations
export const fileService = {
  // Get all files
  async getFiles(): Promise<FileRecord[]> {
    // Get current user from store
    const userStore = useUserStore();
    const userId = userStore.currentUserId;
    
    console.log(`Getting files for user: ${userId}`);
    
    const response = await api.get('/files', {
      params: { userId },
      headers: {
        'Authorization': `Bearer ${userId}`
      }
    });
    return response.data;
  },

  // Get a specific file by ID
  async getFile(id: string): Promise<FileRecord> {
    const response = await api.get(`/files/${id}`);
    return response.data;
  },

  // Upload a file using FormData and Multer
  async uploadFile(fileMetadata: Partial<FileRecord>, actualFile: Blob | globalThis.File): Promise<FileRecord> {
    try {
      console.log('Preparing file upload with metadata:', fileMetadata);
      console.log('File object type:', actualFile.constructor.name);
      console.log('File size:', actualFile.size, 'bytes');
      
      const formData = new FormData();
      
      // Add the file to FormData
      formData.append('file', actualFile);
      
      // Always use the current user from store as the owner
      const userStore = useUserStore();
      const userId = userStore.currentUserId;
      formData.append('userId', userId);
      formData.append('ownerId', userId);
      
      console.log('Sending request to /files/upload endpoint with userId:', userId);
      
      // We're adding the userId both as form data and as a query parameter to ensure it's received
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: {
          userId: userId // Add as query parameter using axios params option
        }
      });
      
      console.log('File upload successful. Response:', response.data);
      return response.data;
    } catch (error: any) { // Type assertion for axios error handling
      console.error('File upload failed:', error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response error data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Request made but no response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
      }
      
      throw error; // Re-throw to let calling code handle it
    }
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
    // Always set the current user as the owner
    const userStore = useUserStore();
    const userId = userStore.currentUserId;
    
    // Create a new file object with the current user as owner
    const fileWithOwner = {
      ...file,
      ownerId: userId,
      userId: userId // Include both for backwards compatibility
    };
    
    console.log('Creating file with owner:', userId);
    
    const response = await api.post('/files', fileWithOwner, {
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  },

  // Delete a file by ID
  async deleteFile(id: string): Promise<void> {
    // Get current user from store
    const userStore = useUserStore();
    const userId = userStore.currentUserId;
    
    console.log(`Deleting file with ID: ${id} as user: ${userId}`);
    
    try {
      await api.delete(`/files/${id}`, {
        headers: {
          'Authorization': `Bearer ${userId}`,
          'Content-Type': 'application/json'
        },
        params: { userId: userId }
      });
      
      console.log('File deletion successful');
    } catch (error: any) {
      console.error('Error deleting file:', error);
      
      if (error.response) {
        console.error('Response error data:', error.response.data);
        console.error('Response status:', error.response.status);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      throw error;
    }
  },

  // Get all files that the current user has access to (including permissions)
  async getAccessibleFiles(): Promise<FileRecord[]> {
    // Get current user from store
    const userStore = useUserStore();
    const userId = userStore.currentUserId;
    
    console.log(`Getting accessible files for user: ${userId}`);
    
    try {
      const response = await api.get('/files/accessible', {
        params: { userId },
        headers: {
          'Authorization': `Bearer ${userId}`
        }
      });
      
      // Add userPermission field to each file for easy access
      const files = response.data.map((file: any) => {
        const permissionForCurrentUser = file.permissions?.find((p: any) => p.userId === userId);
        
        return {
          ...file,
          userPermission: permissionForCurrentUser ? 
            (permissionForCurrentUser.canDelete ? 'delete' : 
             permissionForCurrentUser.canWrite ? 'write' : 
             'read') : null
        };
      });
      
      console.log(`Found ${files.length} accessible files`);
      return files;
    } catch (error: any) {
      console.error('Error fetching accessible files:', error);
      
      if (error.response) {
        console.error('Response error data:', error.response.data);
        console.error('Response status:', error.response.status);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      throw error;
    }
  },
  
  // Update permission for a file (simplified API)
  async updatePermission(fileId: string, permission: PermissionRequest): Promise<FileRecord | { success: boolean, message: string }> {
    // Get current user from store
    const userStore = useUserStore();
    const userId = userStore.currentUserId;
    
    console.log(`Setting permission for file: ${fileId} as user: ${userId}`);
    console.log('Permission request:', JSON.stringify(permission));
    
    try {
      // Add proper Authorization header and send the userId in both query param and request body
      const response = await api.post(
        `/files/${fileId}/permissions`, 
        permission,
        {
          headers: {
            'Authorization': `Bearer ${userId}`,
            'Content-Type': 'application/json'
          },
          params: { userId: userId }
        }
      );
      
      console.log('Permission update successful. Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating permission:', error);
      
      if (error.response) {
        console.error('Response error data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      throw error;
    }
  }
};

export default fileService
