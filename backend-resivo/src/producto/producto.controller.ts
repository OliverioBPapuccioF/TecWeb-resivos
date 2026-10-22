import { Controller, Get } from '@nestjs/common';
import { ProductoService } from './producto.service.js';

// here the request it going to be handled by the each controller
// and each controller is going to call the service to handle the request and return the response
// for example the request GET /producto it going to call the ProductoService and will be returning a list of all producto items

@Controller('producto')
export class ProductoController {
    constructor(private readonly ProductoService: ProductoService) {}
    //getAll: return a list of all producto items
    //getById: return a single producto item by id
    //create: create a new producto item
    //update: update a single producto item by id
    //delete: delete a single producto item by id
}
