import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateResivoDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsDateString()
  tiempoCompra!: string;

  @IsString()
  @IsNotEmpty()
  metodoPago!: string;
}
