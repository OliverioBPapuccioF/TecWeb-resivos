import { Type } from 'class-transformer';
import {
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Max,
} from 'class-validator';
import { MAX_ENTERO_DB, Recortar } from '../../common/validaciones.js';

// the ValidationPipe uses stopAtFirstError: only the first failing rule of each field is reported.
// class-validator checks the rules of a field FROM THE BOTTOM UP, so the most basic rule
// (is it there?) goes last and the most specific one goes first
export class CreateProductoDto {
  @Recortar()
  @IsString({ message: 'El nombre del producto tiene que ser texto' })
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  nombre!: string;

  @Type(() => Number)
  @Max(MAX_ENTERO_DB, { message: 'La cantidad es demasiado grande' })
  @IsPositive({ message: 'La cantidad tiene que ser mayor a 0' })
  @IsInt({ message: 'La cantidad tiene que ser un número entero' })
  @IsDefined({ message: 'La cantidad es obligatoria' })
  cantidad!: number;

  // can be 0 or negative (discounts and promotions)
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: 'El precio tiene que ser un número con hasta 2 decimales' },
  )
  @IsDefined({ message: 'El precio es obligatorio' })
  precio!: number;

  @Type(() => Number)
  @Max(MAX_ENTERO_DB, {
    message: 'El recibo tiene que ser un id válido (número entero mayor a 0)',
  })
  @IsPositive({
    message: 'El recibo tiene que ser un id válido (número entero mayor a 0)',
  })
  @IsInt({
    message: 'El recibo tiene que ser un id válido (número entero mayor a 0)',
  })
  @IsDefined({ message: 'El recibo es obligatorio' })
  resivoId!: number;
}
