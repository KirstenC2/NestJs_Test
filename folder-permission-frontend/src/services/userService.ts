import api from './api';

// User type definition
export interface User {
  id: string;
  name: string;
  isActive?: boolean;
}

// Service for handling user operations
export const userService = {
  // Get all users
  async getUsers(): Promise<User[]> {
    try {
      const response = await api.get('/users');
      console.log('Retrieved users from API:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching users:', error);
      
      if (error.response) {
        console.error('Response error data:', error.response.data);
        console.error('Response status:', error.response.status);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      // Return empty array if there's an error, with a default user as fallback
      console.warn('Returning default user due to API error');
      return [
        { id: '11111111-1111-1111-1111-111111111111', name: '默認使用者 (Owner)' }
      ];
    }
  },
  
  // Get a specific user by ID
  async getUser(id: string): Promise<User> {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  }
};

export default userService;
