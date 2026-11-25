import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { MAX_ENTERO_DB } from './validaciones.js';

// replaces ParseIntPipe for the ':id' of the routes:
// same idea, but with the message in Spanish and only ids that can exist (1 to MAX_ENTERO_DB)
// (the global ValidationPipe with transform: true may have already turned the text into a number,
// so both cases are accepted)
@Injectable()
export class ParseIdPipe implements PipeTransform<string | number, number> {
  transform(valor: string | number): number {
    const id = Number(valor);

    if (!Number.isInteger(id) || id < 1 || id > MAX_ENTERO_DB) {
      throw new BadRequestException(
        'El id tiene que ser un número entero mayor a 0',
      );
    }

    return id;
  }
}
