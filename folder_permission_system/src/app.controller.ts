// files.controller.ts
import { Controller, Get, Post, Body, Param, Delete, UseInterceptors, UploadedFile, Res, ForbiddenException, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { FilesService } from './app.service';
import { RequirePermission } from './decorators/permission.decorator';

// Define storage configuration for Multer
const storage = diskStorage({
  destination: './uploads',
  filename: (req, file, callback) => {
    const uniqueSuffix = uuidv4();
    const ext = extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;
    callback(null, filename);
  },
});

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { userId?: string },
  ) {
    console.log('Received file upload request:', { file, body });
    const fileData = {
      id: uuidv4(),
      originalname: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      uploadDate: new Date(),
      userId: body.userId || 'anonymous',
      permissions: [],
    };
    
    return await this.filesService.create(fileData);
  }

  @Post(':id/permissions')
  @RequirePermission('owner')
  async updatePermissions(
    @Param('id') id: string,
    @Body() body: { userId: string, permission: string },
  ): Promise<any> {
    return await this.filesService.updatePermission(id, body.userId, body.permission);
  }
  
  @Delete(':id/permissions/:userId')
  @RequirePermission('owner')
  async removePermission(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<any> {
    return await this.filesService.updatePermission(id, userId, 'none');
  }

  @Get('download/:id')
  @RequirePermission('read')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const file = await this.filesService.findOne(id);
    return res.download(file.path, file.originalname);
  }

  @Post()
  async create(@Body() createFileDto: any) {
    return this.filesService.create(createFileDto);
  }

  @Get()
  async findAll(@Query('userId') userId: string) {
    return this.filesService.findAll(userId);
  }
  
  @Get('accessible')
  async findAccessible(@Query('userId') userId: string) {
    return this.filesService.findAccessible(userId);
  }

  @Get(':id')
  @RequirePermission('read')
  async findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @Delete(':id')
  @RequirePermission('owner')
  async remove(@Param('id') id: string) {
    return this.filesService.remove(id);
  }

  @Get('hello')
  getHello() {
    return 'Hello World!';
  }
}