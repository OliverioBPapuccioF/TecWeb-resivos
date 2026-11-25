import {
  Controller,
  Delete,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ParseIdPipe } from '../common/parse-id.pipe.js';
import { ProductoService } from './producto.service.js';
import { CreateProductoDto } from './dto/create-producto.dto.js';
import { UpdateProductoDto } from './dto/update-producto.dto.js';

// here the request it going to be handled by the each controller
// and each controller is going to call the service to handle the request and return the response
// for example the request GET /producto it going to call the ProductoService and will be returning a list of all producto items

@Controller('producto')
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}
  //getAll: return a list of all producto items (GET /producto?nombre=x filters by name)
  @Get()
  getAll(@Query('nombre') nombre?: string) {
    return this.productoService.getAll(nombre);
  }

  //getById: return a single producto item by id
  @Get(':id')
  getById(@Param('id', ParseIdPipe) id: number) {
    return this.productoService.getById(id);
  }

  //create: create a new producto item
  @Post()
  create(@Body() createProductoDto: CreateProductoDto) {
    return this.productoService.create(createProductoDto);
  }

  //update: update a single producto item by id
  @Patch(':id')
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body() updateProductoDto: UpdateProductoDto,
  ) {
    return this.productoService.update(id, updateProductoDto);
  }

  //delete: delete a single producto item by id
  @Delete(':id')
  delete(@Param('id', ParseIdPipe) id: number) {
    return this.productoService.delete(id);
  }
}
