import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesController } from './app.controller';
import { FilesService } from './app.service';
import { RootController } from './app.root.controller';
import { UsersController } from './users.controller';
import { LoggingInterceptor } from './logging.interceptor';
import { PermissionsGuard } from './guards/permissions.guard';
import { AuthMiddleware } from './middleware/auth.middleware';
import { DatabaseModule } from './database/database.module';
import { File } from './files/file.entity';
import { UserPermission } from './files/permission.entity';
import { User } from './files/user.entity';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([File, UserPermission, User])
  ],
  controllers: [FilesController, RootController, UsersController],
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
