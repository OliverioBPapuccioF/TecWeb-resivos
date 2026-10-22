import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateProductoDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  cantidad!: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  precio!: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  resivoId!: number;
}
