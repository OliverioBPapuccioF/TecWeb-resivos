import { Component } from '@angular/core';
import { EstadisticasService } from '../../../services/estadisticas.service';
import { PeticionComponent } from '../peticion/peticion.component';
import { Peticion, VistaPeticiones } from '../peticiones';

// /example/estadistica: the 4 statistics, only shown.
// They are requested every time the view is opened.
@Component({
  selector: 'app-estadisticas',
  imports: [PeticionComponent],
  templateUrl: './estadisticas.component.html',
  styleUrl: './estadisticas.component.css',
})
export class EstadisticasComponent extends VistaPeticiones {
  protected readonly estadisticas: Peticion[] = [
    {
      clave: 's1',
      titulo: 'Últimos 5 recibos',
      metodo: 'GET',
      ruta: () => '/resivo/estadisticas/ultimos',
      llamar: () => this.estadisticasService.getUltimos(),
    },
    {
      clave: 's2',
      titulo: 'Por método de pago',
      metodo: 'GET',
      ruta: () => '/resivo/estadisticas/metodo-pago',
      llamar: () => this.estadisticasService.getPorMetodoPago(),
    },
    {
      clave: 's3',
      titulo: 'Gasto por fecha',
      metodo: 'GET',
      ruta: () => '/resivo/estadisticas/por-fecha',
      llamar: () => this.estadisticasService.getPorFecha(),
    },
    {
      clave: 's4',
      titulo: 'Gasto por local',
      metodo: 'GET',
      ruta: () => '/resivo/estadisticas/por-local',
      llamar: () => this.estadisticasService.getPorLocal(),
    },
  ];

  constructor(private estadisticasService: EstadisticasService) {
    super();
    void this.cargar();
  }

  // one after the other (not at the same time), so each box shows the status of its own answer
  private async cargar(): Promise<void> {
    for (const p of this.estadisticas) {
      await this.enviar(p);
    }
  }
}
