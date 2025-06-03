import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './app.controller';
import { FilesService } from './app.service';

describe('FilesController', () => {
  let controller: FilesController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [FilesService],
    }).compile();

    controller = app.get<FilesController>(FilesController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(controller.getHello()).toBe('Hello World!');
    });
  });
});
