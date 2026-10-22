import { Module } from '@nestjs/common';
import { ResivoController } from './resivo.controller.js';
import { ResivoService } from './resivo.service.js';
import { ProductoModule } from '../producto/producto.module.js';

// here any request that have /resivo path will be handled by the ResivoController and the ResivoService
// from here the controller will handle the request
// for example the request GET /resivo will be returning a list of all resivo items

@Module({
  imports: [ProductoModule],
  controllers: [ResivoController],
  providers: [ResivoService]
})
export class ResivoModule {}
