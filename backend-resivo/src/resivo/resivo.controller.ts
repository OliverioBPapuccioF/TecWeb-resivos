import {
      Controller,
      Get,
      Post,
      Patch,
      Delete,
      Body,
      Param,
      ParseIntPipe,
      Query,
} from '@nestjs/common';
import { ResivoService } from './resivo.service.js';
import { CreateResivoDto } from './dto/create-resivo.dto.js';
import { UpdateResivoDto } from './dto/update-resivo.dto.js';

// here the request it going to be handled by the each controller
// and each controller is going to call the service to handle the request and return the response
// for example the request GET /resivo it going to call the ResivoService and will be returning a list of all resivo items

@Controller('resivo')
export class ResivoController {
      constructor(private readonly ResivoService: ResivoService) {}
      //getAll: return a list of all resivo items
      @Get()
      getAll(@Query('nombre') nombre?: string) {
            return this.ResivoService.getAll(nombre);
      }

      @Get('buscar')
      searchByName(@Query('nombre') nombre: string) {
            return this.ResivoService.searchByName(nombre);
      }

      //getById: return a single resivo item by id
      @Get(':id')
      getById(@Param('id', ParseIntPipe) id: number) {
            return this.ResivoService.getById(id);
      }

      //create: create a new resivo item
      @Post()
      create(@Body() createResivoDto: CreateResivoDto) {
            return this.ResivoService.create(createResivoDto);
      }

      //update: update a single resivo item by id
      @Patch(':id')
      update(@Param('id', ParseIntPipe) id: number, @Body() updateResivoDto: UpdateResivoDto) {
            return this.ResivoService.update(id, updateResivoDto);
      }

      //delete: delete a single resivo item by id
      @Delete(':id')
      delete(@Param('id', ParseIntPipe) id: number) {
            return this.ResivoService.delete(id);
      }
}
