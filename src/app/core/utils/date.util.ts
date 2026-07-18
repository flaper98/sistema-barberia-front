/**
 * Convierte un Date a 'YYYY-MM-DD' usando los componentes LOCALES (año, mes, día).
 *
 * NO usar `date.toISOString().split('T')[0]` para esto: toISOString() primero
 * convierte a UTC, así que en cualquier huso horario detrás de UTC (Perú,
 * UTC-5) esa conversión salta al día siguiente apenas pasan las 19:00 hora
 * local -- el "hoy" del dashboard/agenda terminaba mostrando mañana.
 */
export function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}
