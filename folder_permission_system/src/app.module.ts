import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { FilesController } from './app.controller';
import { FilesService } from './app.service';
import { RootController } from './app.root.controller';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { PermissionsGuard } from './guards/permissions.guard';
import { AuthMiddleware } from './middleware/auth.middleware';

@Module({
  imports: [],
  controllers: [FilesController, RootController],
  providers: [
    FilesService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply AuthMiddleware to all routes
    consumer
      .apply(AuthMiddleware)
      .forRoutes('*');
  }
}
