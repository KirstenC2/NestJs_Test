import { Controller, Get } from '@nestjs/common';

@Controller()
export class RootController {
  @Get()
  getHello(): string {
    return 'Welcome to the Folder Permission System API. Use /files to access file endpoints.';
  }
}
