import { Pipe, PipeTransform } from '@angular/core';

// Money as the design asks: $7.400 (dot for thousands, no decimals if it is a whole number)
// and $1.500,50 when it has cents. Negative amounts (discounts): -$1.200
//   {{ recibo.total | precio }}
@Pipe({
  name: 'precio',
})
export class PrecioPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    if (valor === null || valor === undefined || Number.isNaN(valor)) return '';
    const conCentavos = !Number.isInteger(valor);
    const numero = Math.abs(valor).toLocaleString('es-AR', {
      minimumFractionDigits: conCentavos ? 2 : 0,
      maximumFractionDigits: 2,
    });
    return `${valor < 0 ? '-' : ''}$${numero}`;
  }
}
