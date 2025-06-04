import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    const now = Date.now();
    
    console.log('--------------------------------------------');
    console.log(`API Request: ${method} ${url}`);
    console.log('Headers:', JSON.stringify(req.headers));
    console.log('Query params:', JSON.stringify(req.query));
    console.log('Request body:', JSON.stringify(req.body));
    console.log('Route params:', JSON.stringify(req.params));
    console.log('User:', JSON.stringify(req.user));
    
    return next
      .handle()
      .pipe(
        tap(data => {
          const delay = Date.now() - now;
          
          // Safely log the response data
          try {
            if (data === undefined || data === null) {
              console.log(`API Response (${delay}ms): [No data]`);
            } else if (data instanceof Buffer || req.url.includes('/download/')) {
              // Handle binary data like file downloads
              console.log(`API Response (${delay}ms): [Binary data / File download]`);
            } else {
              // Try to stringify and truncate for regular JSON responses
              const stringified = JSON.stringify(data);
              console.log(`API Response (${delay}ms):`, stringified ? stringified.substring(0, 200) : '[Unstringifiable data]');
            }
          } catch (error) {
            console.log(`API Response (${delay}ms): [Error logging response: ${error.message}]`);
          }
          
          console.log('--------------------------------------------');
        }),
      );
  }
}
