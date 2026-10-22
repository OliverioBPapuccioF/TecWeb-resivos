import { Controller, Get} from '@nestjs/common';
import { ResivoService } from './resivo.service.js';

// here the request it going to be handled by the each controller
// and each controller is going to call the service to handle the request and return the response
// for example the request GET /resivo it going to call the ResivoService and will be returning a list of all resivo items

@Controller('resivo')
export class ResivoController {
      constructor(private readonly ResivoService: ResivoService) {}
      //getAll: return a list of all resivo items
      //getById: return a single resivo item by id
      //create: create a new resivo item
      //update: update a single resivo item by id
      //delete: delete a single resivo item by id
}
