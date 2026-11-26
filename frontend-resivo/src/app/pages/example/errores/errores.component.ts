import { Component } from '@angular/core';
import { ResivoService } from '../../../services/resivo.service';
import { ProductoService } from '../../../services/producto.service';
import { PeticionComponent } from '../peticion/peticion.component';
import { Peticion, VistaPeticiones } from '../peticiones';

// /example/error: requests that fail on purpose, to see the errors of the API
// (code and message in Spanish). Any order, and they can be sent again.
@Component({
  selector: 'app-errores',
  imports: [PeticionComponent],
  templateUrl: './errores.component.html',
  styleUrl: './errores.component.css',
})
export class ErroresComponent extends VistaPeticiones {
  protected readonly errores: Peticion[] = [
    {
      clave: 'e1',
      titulo: 'Body vacío → 400 (lista)',
      metodo: 'POST',
      ruta: () => '/resivo',
      body: () => ({}),
      llamar: () => this.resivoService.create({} as never),
    },
    {
      clave: 'e2',
      titulo: 'Fecha futura → 400',
      metodo: 'POST',
      ruta: () => '/resivo',
      body: () => ({ nombre: 'x', tiempoCompra: '2099-01-01', metodoPago: 'Efectivo' }),
      llamar: () =>
        this.resivoService.create({
          nombre: 'x',
          tiempoCompra: '2099-01-01',
          metodoPago: 'Efectivo',
        }),
    },
    {
      clave: 'e3',
      titulo: 'Recibo inexistente → 404',
      metodo: 'GET',
      ruta: () => '/resivo/999999',
      llamar: () => this.resivoService.getById(999999),
    },
    {
      clave: 'e4',
      titulo: 'Id inválido → 400',
      metodo: 'GET',
      ruta: () => '/resivo/abc',
      // on purpose: a text where the service expects a number
      llamar: () => this.resivoService.getById('abc' as unknown as number),
    },
    {
      clave: 'e5',
      titulo: 'PATCH sin campos → 400',
      metodo: 'PATCH',
      ruta: () => '/producto/1',
      body: () => ({}),
      llamar: () => this.productoService.update(1, {}),
    },
    {
      clave: 'e6',
      titulo: 'Recibo del producto inexistente → 404',
      metodo: 'POST',
      ruta: () => '/producto',
      body: () => ({ nombre: 'x', cantidad: 1, precio: 100, resivoId: 999999 }),
      llamar: () =>
        this.productoService.create({ nombre: 'x', cantidad: 1, precio: 100, resivoId: 999999 }),
    },
  ];

  constructor(
    private resivoService: ResivoService,
    private productoService: ProductoService,
  ) {
    super();
  }
}
