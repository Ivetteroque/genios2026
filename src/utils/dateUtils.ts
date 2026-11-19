/**
 * Fechas "de calendario" (YYYY-MM-DD) en la hora del teléfono de la persona.
 *
 * No usar `new Date().toISOString().slice(0, 10)` para "hoy": eso da la fecha
 * en UTC, y en Perú (UTC-5) a partir de las 7 p. m. ya es "mañana".
 * Tampoco `new Date('2026-11-19')`: JavaScript la lee como medianoche UTC, que
 * en Perú es todavía el día anterior.
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** YYYY-MM-DD de una fecha, en hora local. */
export const localDateISO = (date: Date = new Date()): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Convierte YYYY-MM-DD en una fecha a medianoche LOCAL. */
export const parseLocalDate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const addDays = (date: Date, days: number): Date => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

export const isSameLocalDay = (a: Date, b: Date) => localDateISO(a) === localDateISO(b);
