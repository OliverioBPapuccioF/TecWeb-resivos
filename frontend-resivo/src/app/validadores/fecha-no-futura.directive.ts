import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

// today as 'YYYY-MM-DD' in the time zone of the browser (the format of <input type="date">)
export function hoy(): string {
  return new Date().toLocaleDateString('en-CA');
}

// Validator for template-driven forms: a date after today is an error.
//   <input type="date" name="fecha" [(ngModel)]="..." appFechaNoFutura #fecha="ngModel" />
//   @if (fecha.errors?.['fechaFutura']) { ... }
// (the `max` validator of Angular only works with numbers, not with dates)
@Directive({
  selector: '[appFechaNoFutura]',
  // registers this class as one more validator of the field, next to required, pattern...
  providers: [{ provide: NG_VALIDATORS, useExisting: FechaNoFuturaDirective, multi: true }],
})
export class FechaNoFuturaDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    const valor = control.value as string | null;
    // an empty field is the job of `required`; 'YYYY-MM-DD' can be compared as text
    return valor && valor > hoy() ? { fechaFutura: true } : null;
  }
}
