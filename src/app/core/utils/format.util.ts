/** Código de cliente/producto tal como se muestra en pantalla (ej. id=4 -> "0004"). */
export function formatCodigo(id: number): string {
  return id.toString().padStart(4, '0');
}
