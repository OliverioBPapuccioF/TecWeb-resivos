import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductoService } from './producto.service.js';
import { Producto } from './entities/producto.entity.js';
import { ResivoService } from '../resivo/resivo.service.js';

describe('ProductoService', () => {
  let service: ProductoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductoService,
        // fakes: these tests do not touch the database
        { provide: getRepositoryToken(Producto), useValue: {} },
        { provide: ResivoService, useValue: {} },
      ],
    }).compile();

    service = module.get<ProductoService>(ProductoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
