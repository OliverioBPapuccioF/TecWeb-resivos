import { Chart } from 'chart.js';

// Colors and fonts of the charts, read from the CSS variables of styles.css,
// so the charts follow the design (and there are no loose colors in the code).

function variable(nombre: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
}

// colors for the slices / bars, in the order of the design: blue, turquoise, violet and their
// "neighbours". Red is NOT used: in this design it is only for deleting and for errors
export function paleta(): string[] {
  return [
    '--azul',
    '--turquesa',
    '--violeta',
    '--azul-vecino',
    '--turquesa-vecino',
    '--violeta-claro',
  ].map(variable);
}

export const colores = {
  borde: () => variable('--gris-900'),
  otros: () => variable('--gris-300'),
  texto: () => variable('--gris-700'),
  grilla: () => variable('--gris-100'),
  azul: () => variable('--azul'),
};

// fonts of every chart: the interface font (labels, legends, axes), like the rest of the UI
export function configurarGraficos(): void {
  Chart.defaults.font.family = variable('--fuente-interfaz');
  Chart.defaults.font.size = 12;
  Chart.defaults.color = colores.texto();
}
