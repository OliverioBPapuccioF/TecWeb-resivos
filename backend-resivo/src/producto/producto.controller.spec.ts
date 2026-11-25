import { Test, TestingModule } from '@nestjs/testing';
import { ProductoController } from './producto.controller.js';
import { ProductoService } from './producto.service.js';

describe('ProductoController', () => {
  let controller: ProductoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductoController],
      // the controller only needs a ProductoService: a fake one is enough here
      providers: [{ provide: ProductoService, useValue: {} }],
    }).compile();

    controller = module.get<ProductoController>(ProductoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
