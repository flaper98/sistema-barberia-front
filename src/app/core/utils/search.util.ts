/**
 * Estandar de busqueda de texto para toda la app (mismo criterio que el
 * backend, ver TextSearchSpecification): separa el texto ingresado en
 * palabras y exige que CADA palabra aparezca en ALGUNO de los campos
 * indicados, sin importar el orden.
 * <p>
 * Evita el bug clasico de comparar el texto completo (ej. "Flavio Talledo")
 * contra un solo campo concatenado a la vez -- si el nombre esta en un
 * campo y el apellido en otro, buscar el nombre completo con orden
 * invertido, o solo una parte de cada uno, no encontraba nada.
 *
 * @example
 *   matchesSearch('Talledo Flavio', cliente.nombre, cliente.apellido, cliente.telefono)
 */
export function matchesSearch(search: string, ...campos: (string | null | undefined)[]): boolean {
  const palabras = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return true;

  const valores = campos.filter((c): c is string => !!c).map(c => c.toLowerCase());
  return palabras.every(palabra => valores.some(valor => valor.includes(palabra)));
}
