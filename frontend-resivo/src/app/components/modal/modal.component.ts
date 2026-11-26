import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

let contador = 0;

// Popup over the page (styles: .modal-fondo, .modal, .modal__acciones in styles.css).
// The page decides when it exists: @if (abierto()) { <app-modal ...> ... </app-modal> }
//
//   <app-modal titulo="Nuevo recibo" [ocupado]="guardando()" (cerrar)="abierto.set(false)">
//     ...the content (e.g. a form)...
//     <button acciones class="btn-primario">Guardar</button>   <- goes at the bottom
//   </app-modal>
//
// - "Cerrar" always on top, next to the title. At the bottom, a "Cancelar" button
//   (textoCerrar changes its text; [textoCerrar]="null" removes it, e.g. when the bottom
//   has another action like "Agregar producto").
// - [ancho]="true": wider box, for a table.
// - It closes (emits `cerrar`) with its buttons, a click on the dark background or Esc,
//   except while `ocupado` is true (the form is being sent).
// - Modals can be stacked (one opened from another): Esc and the click outside only close
//   the one in front, and the page scrolls again when the last one is closed.
@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class ModalComponent implements AfterViewInit, OnDestroy {
  // the open modals, in the order they were opened (the last one is the one in front)
  private static abiertos: ModalComponent[] = [];
  // overflow of the page before the FIRST modal was opened (it is given back when the last
  // one closes, whatever the order in which they are closed)
  private static overflowOriginal = '';

  @Input({ required: true }) titulo = '';
  // text of the close button at the bottom (null = no close button at the bottom)
  @Input() textoCerrar: string | null = 'Cancelar';
  // true while saving: it can not be closed
  @Input() ocupado = false;
  // true = wider box, for content like a table (e.g. the productos of a resivo)
  @Input() ancho = false;

  @Output() cerrar = new EventEmitter<void>();

  @ViewChild('caja') private caja!: ElementRef<HTMLElement>;

  // id that links the dialog with its title (for screen readers)
  protected readonly idTitulo = `modal-titulo-${++contador}`;
  // the element that had the focus before opening (it gets it back when closing)
  private focoAnterior: HTMLElement | null = null;

  constructor(@Inject(DOCUMENT) private documento: Document) {
    // the first modal that opens keeps how the page was, and blocks its scroll
    if (ModalComponent.abiertos.length === 0) {
      ModalComponent.overflowOriginal = this.documento.body.style.overflow;
      this.documento.body.style.overflow = 'hidden';
    }
    ModalComponent.abiertos.push(this);
  }

  ngAfterViewInit(): void {
    this.focoAnterior = this.documento.activeElement as HTMLElement | null;
    // focus on the first field of the form (or on the first button if there are no fields)
    const caja = this.caja.nativeElement;
    const primero =
      caja.querySelector<HTMLElement>('input, select, textarea') ??
      caja.querySelector<HTMLElement>('button');
    primero?.focus();
  }

  ngOnDestroy(): void {
    ModalComponent.abiertos = ModalComponent.abiertos.filter((m) => m !== this);
    // the page scrolls again only when no modal is left open (if each modal gave back what
    // it found, closing them in another order could leave the page without scroll)
    if (ModalComponent.abiertos.length === 0) {
      this.documento.body.style.overflow = ModalComponent.overflowOriginal;
    }
    this.focoAnterior?.focus();
  }

  // a click on the dark background (not inside the box) closes it
  protected clickEnFondo(evento: MouseEvent): void {
    if (evento.target === evento.currentTarget) {
      this.pedirCierre();
    }
  }

  // Esc closes only the modal in front
  @HostListener('document:keydown.escape')
  protected alApretarEsc(): void {
    if (ModalComponent.abiertos.at(-1) === this) {
      this.pedirCierre();
    }
  }

  protected pedirCierre(): void {
    if (!this.ocupado) {
      this.cerrar.emit();
    }
  }
}
