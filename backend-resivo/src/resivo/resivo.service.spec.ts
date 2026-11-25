import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ResivoService } from './resivo.service.js';
import { Resivo } from './entities/resivo.entity.js';
import { METODOS_PAGO } from './metodo-pago.js';

describe('ResivoService', () => {
  let service: ResivoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResivoService,
        // fake repository: these tests do not touch the database
        { provide: getRepositoryToken(Resivo), useValue: {} },
      ],
    }).compile();

    service = module.get<ResivoService>(ResivoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns the fixed list of payment methods', () => {
    expect(service.getMetodosPago()).toEqual(METODOS_PAGO);
  });
});
