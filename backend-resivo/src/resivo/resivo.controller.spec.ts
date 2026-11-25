import { Test, TestingModule } from '@nestjs/testing';
import { ResivoController } from './resivo.controller.js';
import { ResivoService } from './resivo.service.js';

describe('ResivoController', () => {
  let controller: ResivoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResivoController],
      // the controller only needs a ResivoService: a fake one is enough here
      providers: [{ provide: ResivoService, useValue: {} }],
    }).compile();

    controller = module.get<ResivoController>(ResivoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
