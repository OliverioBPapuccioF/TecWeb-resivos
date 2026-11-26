import { Component, OnDestroy, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EstadoParte, SaludService } from '../../services/salud.service';
import { ResivoService } from '../../services/resivo.service';
import { NOMBRE_RECIBO_PRUEBA } from './peticiones';

// /example: test page of the services (not in the menu).
// Header: title, state of the API and of the database, and the tabs to choose the test.
// Body: the chosen test, loaded by the router (/example/recorrido, /error, /estadistica).
@Component({
  selector: 'app-example',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './example.component.html',
  styleUrl: './example.component.css',
})
export class ExampleComponent implements OnDestroy {
  protected readonly apiUrl = environment.apiUrl;
  // false while the tests left unfinished are being deleted (the tests are shown after)
  protected readonly listo = signal(false);
  // how many resivos of unfinished tests were deleted when the page was opened
  protected readonly limpiados = signal(0);

  protected readonly pruebas = [
    { ruta: 'recorrido', nombre: 'Recorrido' },
    { ruta: 'error', nombre: 'Errores' },
    { ruta: 'estadistica', nombre: 'Estadísticas' },
  ];

  // the two indicators of the header (filled in the constructor, where salud already exists)
  protected readonly partes: { nombre: string; estado: () => EstadoParte }[];

  constructor(
    protected salud: SaludService,
    private resivoService: ResivoService,
  ) {
    this.partes = [
      { nombre: 'API', estado: this.salud.api },
      { nombre: 'Base de datos', estado: this.salud.baseDeDatos },
    ];
    // GET /salud now and every 10 s while the page is open
    this.salud.iniciar(10000);
    void this.limpiarPruebasAnteriores();
  }

  ngOnDestroy(): void {
    this.salud.detener();
  }

  // Deletes the resivos that a previous recorrido created and could not delete: the page was
  // reloaded, the tab was closed, ng serve stopped... (leaving the view or "Rehacer" already
  // clean up; this covers the rest). Their productos are deleted with them (cascade).
  // The tests are shown only after this, so it never deletes a resivo of the new recorrido.
  private async limpiarPruebasAnteriores(): Promise<void> {
    try {
      const recibos = await firstValueFrom(this.resivoService.getAll());
      const sobrantes = recibos.filter((r) => r.nombre === NOMBRE_RECIBO_PRUEBA);
      for (const r of sobrantes) {
        await firstValueFrom(this.resivoService.delete(r.id));
      }
      this.limpiados.set(sobrantes.length);
    } catch {
      // the API does not answer: there is nothing to clean (the header already says so)
    }
    this.listo.set(true);
  }
}
