import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { FilesController } from './app.controller';
import { FilesService } from './app.service';
import { RootController } from './app.root.controller';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

@Module({
  imports: [],
  controllers: [FilesController, RootController],
  providers: [
    FilesService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
