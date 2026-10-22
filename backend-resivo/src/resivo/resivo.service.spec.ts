import { Test, TestingModule } from '@nestjs/testing';
import { ResivoService } from './resivo.service.js';

describe('ResivoService', () => {
  let service: ResivoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResivoService],
    }).compile();

    service = module.get<ResivoService>(ResivoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
