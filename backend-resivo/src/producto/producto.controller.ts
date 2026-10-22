import {
    Controller,
    Delete,
    Get,
    Post,
    Patch,
    Param,
    Body,
    ParseIntPipe,
    Query,
} from '@nestjs/common';
import { ProductoService } from './producto.service.js';
import { CreateProductoDto } from './dto/create-producto.dto.js';
import { UpdateProductoDto } from './dto/update-producto.js';

// here the request it going to be handled by the each controller
// and each controller is going to call the service to handle the request and return the response
// for example the request GET /producto it going to call the ProductoService and will be returning a list of all producto items

@Controller('producto')
export class ProductoController {
    constructor(private readonly ProductoService: ProductoService) {}
    //getAll: return a list of all producto items
    @Get()
    getAll(@Query('nombre') nombre?: string) {
        return this.ProductoService.getAll(nombre);
    }

    @Get('buscar')
    searchByName(@Query('nombre') nombre: string) {
        return this.ProductoService.searchByName(nombre);
    }

    //getById: return a single producto item by id
    @Get(':id')
    getById(@Param('id', ParseIntPipe) id: number) {
        return this.ProductoService.getById(id);
    }

    //create: create a new producto item
    @Post()
    create(@Body() createProductoDto: CreateProductoDto) {
        return this.ProductoService.create(createProductoDto);
    }

    //update: update a single producto item by id
    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateProductoDto: UpdateProductoDto) {
        return this.ProductoService.update(id, updateProductoDto);
    }

    //delete: delete a single producto item by id
    @Delete(':id')
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.ProductoService.delete(id);
    }
}
