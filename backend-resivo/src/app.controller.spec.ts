import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;
  // fake database: each test decides what the query does
  const dataSource = { query: vi.fn() };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: DataSource, useValue: dataSource }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('GET / returns the API status (without asking the database)', () => {
    expect(appController.getStatus()).toEqual({
      status: 'ok',
      message: 'API de recibos funcionando',
    });
  });

  it('GET /salud says ok when the database answers', async () => {
    dataSource.query.mockResolvedValue([{ '?column?': 1 }]);
    await expect(appController.getSalud()).resolves.toEqual({
      api: 'ok',
      baseDeDatos: 'ok',
    });
  });

  it('GET /salud answers 503 when the database fails', async () => {
    dataSource.query.mockRejectedValue(new Error('connect ECONNREFUSED'));
    await expect(appController.getSalud()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
