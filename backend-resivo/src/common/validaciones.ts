import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { registerDecorator, ValidationOptions } from 'class-validator';

// trims the spaces at both sides of a text before validating it
// ("  Día " is saved as "Día", and "   " ends up empty so @IsNotEmpty rejects it)
export function Recortar() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}

// today's date as 'YYYY-MM-DD' (server local time)
function hoy(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

// rejects dates after today: a purchase can not be from tomorrow
// (expects 'YYYY-MM-DD', so two dates can be compared as text)
export function NoEsFechaFutura(options?: ValidationOptions) {
  return (objeto: object, propiedad: string) => {
    registerDecorator({
      name: 'noEsFechaFutura',
      target: objeto.constructor,
      propertyName: propiedad,
      options,
      validator: {
        validate: (valor: unknown) =>
          typeof valor === 'string' && valor <= hoy(),
      },
    });
  };
}

// biggest value of an `integer` column in Postgres: a bigger id or cantidad makes the database fail
export const MAX_ENTERO_DB = 2147483647;

// checks the body of a PATCH before updating:
// - it has to bring at least one field (the ValidationPipe drops unknown fields, so it can end up empty)
// - no field can be null: PartialType skips the validation of null values,
//   and the database columns do not accept null
export function validarCamposParaActualizar(
  dto: object,
  camposPermitidos: string[],
) {
  const enviados = Object.entries(dto).filter(
    ([, valor]) => valor !== undefined,
  );

  if (enviados.length === 0) {
    throw new BadRequestException(
      `Tenés que mandar al menos un campo para actualizar: ${camposPermitidos.join(', ')}`,
    );
  }

  const nulos = enviados
    .filter(([, valor]) => valor === null)
    .map(([campo]) => campo);
  if (nulos.length > 0) {
    throw new BadRequestException(
      nulos.map((campo) => `El campo ${campo} no puede ser null`),
    );
  }
}
