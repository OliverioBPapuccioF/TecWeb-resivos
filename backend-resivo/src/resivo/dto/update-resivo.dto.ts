import { PartialType } from '@nestjs/mapped-types';
import { CreateResivoDto } from './create-resivo.dto.js';

export class UpdateResivoDto extends PartialType(CreateResivoDto) {}