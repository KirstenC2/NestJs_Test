import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Mock authentication middleware
 * In a real application, this would verify a JWT token
 */
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Get the Authorization header
    const authHeader = req.headers.authorization;

    // For simplicity, we'll accept any Authorization header that starts with "Bearer "
    // and assume it contains a user ID after that
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // In a real app, you would verify the JWT token here
        // For this mock implementation, we'll just extract a user ID from the token
        const token = authHeader.substring(7); // Remove "Bearer " prefix
        
        // Mock user object - in a real app, this would come from JWT verification
        req['user'] = {
          id: token, // Use token as user ID for simplicity
          username: `user_${token}`,
        };
        
        console.log(`Authenticated user: ${req['user'].username}`);
      } catch (error) {
        console.error('Authentication error:', error);
      }
    }

    next();
  }
}
