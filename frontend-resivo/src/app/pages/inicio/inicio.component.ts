import { Component, computed, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { EstadisticasService } from '../../services/estadisticas.service';
import { mensajesDeError } from '../../services/api-error';
import {
  EstadisticaMetodoPago,
  GastoPorFecha,
  GastoPorLocal,
  UltimoResivo,
} from '../../models/estadisticas.model';
import { CargandoComponent } from '../../components/cargando/cargando.component';
import { ErrorCargaComponent } from '../../components/error-carga/error-carga.component';
import { FechaPipe } from '../../pipes/fecha.pipe';
import { PrecioPipe } from '../../pipes/precio.pipe';
import { colores, configurarGraficos, paleta } from '../../utils/graficos';
import { redondear } from '../../utils/dinero';

// how many locals the pie shows (the rest are added up in "Otros")
const LOCALES_EN_TORTA = 5;
// how many months the bar chart shows (the last ones, up to this month)
const MESES = 12;
const NOMBRES_MES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

// / (home): a summary of the purchases. The API calculates the statistics
// (GET /resivo/estadisticas/*); here they are only arranged to be shown:
// - the last 5 resivos, in cards
// - payment methods (doughnut) and money spent per local (pie: the top 5 + "Otros")
// - money spent per month in the last 12 months (bars), adding up the totals per date
@Component({
  selector: 'app-inicio',
  imports: [BaseChartDirective, CargandoComponent, ErrorCargaComponent, FechaPipe, PrecioPipe],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
})
export class InicioComponent {
  protected readonly cargando = signal(true);
  protected readonly error = signal<string[] | null>(null);

  protected readonly ultimos = signal<UltimoResivo[]>([]);
  private readonly metodoPago = signal<EstadisticaMetodoPago | null>(null);
  private readonly porLocal = signal<GastoPorLocal[]>([]);
  private readonly porFecha = signal<GastoPorFecha[]>([]);

  private readonly precio = new PrecioPipe();

  constructor(private estadisticasService: EstadisticasService) {
    configurarGraficos();
    this.cargar();
  }

  // the 4 statistics at the same time (forkJoin waits for all of them)
  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    forkJoin({
      ultimos: this.estadisticasService.getUltimos(),
      metodoPago: this.estadisticasService.getPorMetodoPago(),
      porLocal: this.estadisticasService.getPorLocal(),
      porFecha: this.estadisticasService.getPorFecha(),
    }).subscribe({
      next: (datos) => {
        this.ultimos.set(datos.ultimos);
        this.metodoPago.set(datos.metodoPago);
        this.porLocal.set(datos.porLocal);
        this.porFecha.set(datos.porFecha);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajesDeError(e));
        this.cargando.set(false);
      },
    });
  }

  // ---------- payment methods (doughnut) ----------

  protected readonly masUsado = computed(() => {
    const datos = this.metodoPago();
    if (!datos?.masUsado) return null;
    const cantidad = datos.cantidades.find((c) => c.metodoPago === datos.masUsado)?.cantidad ?? 0;
    const total = datos.cantidades.reduce((suma, c) => suma + c.cantidad, 0);
    return { metodo: datos.masUsado, cantidad, total };
  });

  protected readonly datosMetodo = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const cantidades = this.metodoPago()?.cantidades ?? [];
    return {
      labels: cantidades.map((c) => c.metodoPago),
      datasets: [
        {
          data: cantidades.map((c) => c.cantidad),
          backgroundColor: paleta(),
          borderColor: colores.borde(),
          borderWidth: 2,
        },
      ],
    };
  });

  protected readonly opcionesMetodo: ChartConfiguration<'doughnut'>['options'] = {
    maintainAspectRatio: false,
    cutout: '58%',
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: { label: (c) => ` ${c.parsed} ${c.parsed === 1 ? 'recibo' : 'recibos'}` },
      },
    },
  };

  // ---------- money spent per local (pie: the top 5 + "Otros") ----------

  protected readonly datosLocal = computed<ChartConfiguration<'pie'>['data']>(() => {
    // the API sends them from the biggest to the smallest; a pie can not show negatives
    const positivos = this.porLocal().filter((l) => l.total > 0);
    const primeros = positivos.slice(0, LOCALES_EN_TORTA);
    const otros = redondear(
      positivos.slice(LOCALES_EN_TORTA).reduce((suma, l) => suma + l.total, 0),
    );
    const etiquetas = primeros.map((l) => l.nombre);
    const valores = primeros.map((l) => l.total);
    const fondos = paleta().slice(0, primeros.length);
    if (otros > 0) {
      etiquetas.push('Otros');
      valores.push(otros);
      fondos.push(colores.otros());
    }
    return {
      labels: etiquetas,
      datasets: [
        { data: valores, backgroundColor: fondos, borderColor: colores.borde(), borderWidth: 2 },
      ],
    };
  });

  protected readonly opcionesLocal: ChartConfiguration<'pie'>['options'] = {
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { callbacks: { label: (c) => ` ${this.precio.transform(c.parsed)}` } },
    },
  };

  // ---------- money spent per month, last 12 months (bars) ----------

  protected readonly datosMes = computed<ChartConfiguration<'bar'>['data']>(() => {
    // total per month 'YYYY-MM', adding up the totals of each date
    const porMes = new Map<string, number>();
    for (const dia of this.porFecha()) {
      const mes = dia.fecha.slice(0, 7);
      porMes.set(mes, (porMes.get(mes) ?? 0) + dia.total);
    }
    // the last 12 months up to this one (the ones without purchases, in 0)
    const hoy = new Date();
    const meses = Array.from({ length: MESES }, (_, i) => {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - (MESES - 1 - i), 1);
      const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      const etiqueta = `${NOMBRES_MES[fecha.getMonth()]} ${String(fecha.getFullYear()).slice(2)}`;
      return { etiqueta, total: redondear(porMes.get(clave) ?? 0) };
    });
    return {
      labels: meses.map((m) => m.etiqueta),
      datasets: [
        {
          label: 'Gasto del mes',
          data: meses.map((m) => m.total),
          backgroundColor: colores.azul(),
          borderColor: colores.borde(),
          borderWidth: 2,
          borderRadius: 4,
        },
      ],
    };
  });

  protected readonly opcionesMes: ChartConfiguration<'bar'>['options'] = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (c) => ` ${this.precio.transform(c.parsed.y ?? 0)}` } },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        grid: { color: colores.grilla() },
        ticks: { callback: (valor) => this.precio.transform(Number(valor)) },
      },
    },
  };

  protected readonly hayGastoPorMes = computed(() =>
    (this.datosMes().datasets[0].data as number[]).some((total) => total !== 0),
  );
}
