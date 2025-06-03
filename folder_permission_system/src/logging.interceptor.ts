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
          console.log(`API Response (${delay}ms):`, JSON.stringify(data).substring(0, 200));
          console.log('--------------------------------------------');
        }),
      );
  }
}
