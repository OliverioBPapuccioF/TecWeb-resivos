import { Test, TestingModule } from '@nestjs/testing';
import { ResivoController } from './resivo.controller.js';

describe('ResivoController', () => {
  let controller: ResivoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResivoController],
    }).compile();

    controller = module.get<ResivoController>(ResivoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
