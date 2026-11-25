import {
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';
import { METODOS_PAGO } from '../metodo-pago.js';
import { NoEsFechaFutura, Recortar } from '../../common/validaciones.js';

// the ValidationPipe uses stopAtFirstError: only the first failing rule of each field is reported.
// class-validator checks the rules of a field FROM THE BOTTOM UP, so the most basic rule
// (is it there?) goes last and the most specific one goes first
export class CreateResivoDto {
  @Recortar()
  @IsString({ message: 'El nombre del local tiene que ser texto' })
  @IsNotEmpty({ message: 'El nombre del local es obligatorio' })
  nombre!: string;

  @NoEsFechaFutura({
    message: 'La fecha de compra no puede ser posterior a hoy',
  })
  @IsISO8601(
    { strict: true },
    { message: 'La fecha de compra no es una fecha válida' },
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha de compra tiene que tener el formato AAAA-MM-DD',
  })
  @IsNotEmpty({ message: 'La fecha de compra es obligatoria' })
  tiempoCompra!: string;

  @IsIn(METODOS_PAGO, {
    message: `El método de pago tiene que ser uno de: ${METODOS_PAGO.join(', ')}`,
  })
  @IsNotEmpty({ message: 'El método de pago es obligatorio' })
  metodoPago!: string;
}
