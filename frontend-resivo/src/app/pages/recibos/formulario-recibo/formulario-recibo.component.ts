import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Observable } from 'rxjs';
import { ModalComponent } from '../../../components/modal/modal.component';
import { ResivoService } from '../../../services/resivo.service';
import { mensajesDeError } from '../../../services/api-error';
import { CreateResivoDto, Resivo } from '../../../models/resivo.model';
import { FechaNoFuturaDirective, hoy } from '../../../validadores/fecha-no-futura.directive';

// Form of a resivo inside a modal: the same one to create and to edit.
//   <app-formulario-recibo [recibo]="null" ... />      -> new resivo (POST)
//   <app-formulario-recibo [recibo]="unRecibo" ... />  -> edit it, already filled in (PATCH)
// It emits (guardado) with the resivo that the API answered, or (cerrar) if it is cancelled.
@Component({
  selector: 'app-formulario-recibo',
  imports: [FormsModule, ModalComponent, FechaNoFuturaDirective],
  templateUrl: './formulario-recibo.component.html',
  styleUrl: './formulario-recibo.component.css',
})
export class FormularioReciboComponent implements OnInit {
  // null = new resivo
  @Input() recibo: Resivo | null = null;

  @Output() guardado = new EventEmitter<Resivo>();
  @Output() cerrar = new EventEmitter<void>();

  // the values of the form, bound to the fields with [(ngModel)]
  protected modelo: CreateResivoDto = { nombre: '', tiempoCompra: hoy(), metodoPago: '' };

  protected readonly hoy = hoy();
  protected readonly metodosPago = signal<string[]>([]);
  protected readonly errorMetodos = signal(false);
  protected readonly guardando = signal(false);
  // errors that the API answered when saving (e.g. a 400 of validation)
  protected readonly erroresApi = signal<string[]>([]);

  constructor(private resivoService: ResivoService) {}

  ngOnInit(): void {
    // editing: the form starts with the data of the resivo (a copy, so the card does not
    // change while typing and nothing changes if it is cancelled)
    if (this.recibo) {
      const { nombre, tiempoCompra, metodoPago } = this.recibo;
      this.modelo = { nombre, tiempoCompra, metodoPago };
    }
    // the options of the <select> come from the API (the same list it validates against)
    this.resivoService.getMetodosPago().subscribe({
      next: (metodos) => this.metodosPago.set(metodos),
      error: () => this.errorMetodos.set(true),
    });
  }

  protected get titulo(): string {
    return this.recibo ? 'Editar recibo' : 'Nuevo recibo';
  }

  protected guardar(form: NgForm): void {
    this.erroresApi.set([]);
    // with errors, it does not send anything: form.submitted makes every message appear
    if (form.invalid) {
      return;
    }

    this.guardando.set(true);
    const datos: CreateResivoDto = { ...this.modelo, nombre: this.modelo.nombre.trim() };
    const pedido: Observable<Resivo> = this.recibo
      ? this.resivoService.update(this.recibo.id, datos)
      : this.resivoService.create(datos);

    pedido.subscribe({
      next: (recibo) => {
        this.guardando.set(false);
        this.guardado.emit(recibo);
      },
      error: (e) => {
        // the modal stays open with the messages of the API, to correct and try again
        this.guardando.set(false);
        this.erroresApi.set(mensajesDeError(e));
      },
    });
  }
}
