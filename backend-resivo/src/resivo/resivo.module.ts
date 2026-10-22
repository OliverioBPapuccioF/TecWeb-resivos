import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResivoController } from './resivo.controller.js';
import { ResivoService } from './resivo.service.js';
import { Resivo } from './entities/resivo.entity.js';

// here any request that have /resivo path will be handled by the ResivoController and the ResivoService
// from here the controller will handle the request
// for example the request GET /resivo will be returning a list of all resivo items

@Module({
  imports: [TypeOrmModule.forFeature([Resivo])],
  controllers: [ResivoController],
  providers: [ResivoService],
  exports: [ResivoService]
})
export class ResivoModule {}
