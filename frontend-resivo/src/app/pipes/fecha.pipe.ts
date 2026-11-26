import { Pipe, PipeTransform } from '@angular/core';

// Dates as the design asks: '2026-10-18' (how the API sends them) -> '18/10/2026'.
// It only rearranges the text: it does not create a Date, so the time zone can not
// move it to the day before.
//   {{ recibo.tiempoCompra | fecha }}
@Pipe({
  name: 'fecha',
})
export class FechaPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    if (!valor) return '';
    const [anio, mes, dia] = valor.slice(0, 10).split('-');
    return dia && mes && anio ? `${dia}/${mes}/${anio}` : valor;
  }
}
