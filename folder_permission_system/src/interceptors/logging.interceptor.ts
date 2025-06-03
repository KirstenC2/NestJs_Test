import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, path, params, query, body } = request;
    
    // Extract user information (this will be populated by auth middleware later)
    const userId = request['user']?.id || 'anonymous';
    
    // Extract file ID from various possible sources
    const fileId = 
      params?.id || 
      query?.fileId || 
      path.match(/\/files\/([^\/]+)/)?.at(1) || 
      'unknown';
    
    // Determine operation type based on HTTP method and path
    const operationType = this.getOperationType(method, path);

    // Log the start of the request
    const timestamp = new Date().toISOString();
    this.logger.log(
      `[${timestamp}] User:${userId} | File:${fileId} | Operation:${operationType} | Request started`
    );

    const start = Date.now();
    
    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - start;
          const endTimestamp = new Date().toISOString();
          this.logger.log(
            `[${endTimestamp}] User:${userId} | File:${fileId} | Operation:${operationType} | Request completed in ${duration}ms`
          );
        },
        error: (error) => {
          const duration = Date.now() - start;
          const endTimestamp = new Date().toISOString();
          this.logger.error(
            `[${endTimestamp}] User:${userId} | File:${fileId} | Operation:${operationType} | Request failed in ${duration}ms: ${error.message}`
          );
        }
      })
    );
  }

  private getOperationType(method: string, path: string): string {
    // Determine operation type based on HTTP method and path
    if (path.includes('/files/upload')) {
      return 'UPLOAD';
    } else if (path.includes('/files/download')) {
      return 'DOWNLOAD';
    } else if (path.includes('/permissions') && method === 'POST') {
      return 'UPDATE_PERMISSIONS';
    } else if (method === 'GET' && path.includes('/files')) {
      return path.includes('/files/') ? 'GET_FILE' : 'LIST_FILES';
    } else if (method === 'POST' && path.includes('/files')) {
      return 'CREATE_FILE';
    } else if (method === 'DELETE' && path.includes('/files')) {
      return 'DELETE_FILE';
    }
    
    return `${method}:${path}`;
  }
}
