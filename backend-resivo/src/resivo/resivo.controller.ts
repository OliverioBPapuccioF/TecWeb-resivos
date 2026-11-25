import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ParseIdPipe } from '../common/parse-id.pipe.js';
import { ResivoService } from './resivo.service.js';
import { CreateResivoDto } from './dto/create-resivo.dto.js';
import { UpdateResivoDto } from './dto/update-resivo.dto.js';

// here the request it going to be handled by the each controller
// and each controller is going to call the service to handle the request and return the response
// for example the request GET /resivo it going to call the ResivoService and will be returning a list of all resivo items

@Controller('resivo')
export class ResivoController {
  constructor(private readonly resivoService: ResivoService) {}
  //getAll: return a list of all resivo items (GET /resivo?nombre=x filters by name)
  @Get()
  getAll(@Query('nombre') nombre?: string) {
    return this.resivoService.getAll(nombre);
  }

  //metodosPago: the fixed list of payment methods (for the frontend <select>)
  // declared before ':id' so 'metodos-pago' is never read as an id
  @Get('metodos-pago')
  getMetodosPago() {
    return this.resivoService.getMetodosPago();
  }

  // estadisticas: declared before ':id' so 'estadisticas' is never read as an id
  @Get('estadisticas/ultimos')
  getUltimos() {
    return this.resivoService.getUltimos();
  }

  @Get('estadisticas/metodo-pago')
  getPorMetodoPago() {
    return this.resivoService.getPorMetodoPago();
  }

  @Get('estadisticas/por-fecha')
  getPorFecha() {
    return this.resivoService.getPorFecha();
  }

  @Get('estadisticas/por-local')
  getPorLocal() {
    return this.resivoService.getPorLocal();
  }

  //getById: return a single resivo item by id
  @Get(':id')
  getById(@Param('id', ParseIdPipe) id: number) {
    return this.resivoService.getById(id);
  }

  //create: create a new resivo item
  @Post()
  create(@Body() createResivoDto: CreateResivoDto) {
    return this.resivoService.create(createResivoDto);
  }

  //update: update a single resivo item by id
  @Patch(':id')
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body() updateResivoDto: UpdateResivoDto,
  ) {
    return this.resivoService.update(id, updateResivoDto);
  }

  //delete: delete a single resivo item by id
  @Delete(':id')
  delete(@Param('id', ParseIdPipe) id: number) {
    return this.resivoService.delete(id);
  }
}
