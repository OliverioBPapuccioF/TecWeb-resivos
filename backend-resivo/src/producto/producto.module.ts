import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductoController } from './producto.controller.js';
import { ProductoService } from './producto.service.js';
import { Producto } from './entities/producto.entity.js';
import { ResivoModule } from '../resivo/resivo.module.js';

// here any request that have /producto path will be handled by the ProductoController and the ProductoService
// from here the controller will handle the request
// for example the request GET /producto will be returning a list of all producto items

@Module({
  imports: [TypeOrmModule.forFeature([Producto]), ResivoModule],
  controllers: [ProductoController],
  providers: [ProductoService],
  exports: [ProductoService]
})
export class ProductoModule {}
