// lowercase and without accents, so a search for "dia" finds "Día" and "credito" finds "Crédito"
export function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
