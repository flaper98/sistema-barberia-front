export type EstadoCorte = 'PENDIENTE' | 'PAGADO';

// Vista previa de lo que un barbero tiene acumulado y todavia no esta en
// ningun corte -- lo que se generaria si se hiciera un corte ahora mismo.
export interface ResumenComision {
  barberoId: number;
  barberoNombre: string;
  fechaDesde: string;
  fechaHasta: string;
  baseServicios: number;
  baseProductos: number;
  comisionServicios: number;
  comisionProductos: number;
  propinasPendientes: number;
  descuentosPendientes: number;
  totalEstimado: number;
}

export interface Propina {
  id: number;
  barberoId: number;
  barberoNombre: string;
  monto: number;
  fecha: string;
  notas?: string;
  usuarioRegistroNombre: string;
  corteId?: number;
  createdAt: string;
}

export interface DescuentoConsumo {
  id: number;
  barberoId: number;
  barberoNombre: string;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  montoTotal: number;
  fecha: string;
  motivo?: string;
  usuarioRegistroNombre: string;
  corteId?: number;
  createdAt: string;
}

export interface CorteComision {
  id: number;
  barberoId: number;
  barberoNombre: string;
  fechaDesde: string;
  fechaHasta: string;
  baseServicios: number;
  baseProductos: number;
  comisionServicios: number;
  comisionProductos: number;
  totalPropinas: number;
  totalDescuentos: number;
  totalAPagar: number;
  estado: EstadoCorte;
  fechaPago?: string;
  notas?: string;
  usuarioRegistroNombre: string;
  createdAt: string;
}

// Un item del catalogo (servicio/producto/paquete) con su % de comision
// actual, para la pantalla Comisiones -> Tasas de comision.
export interface TasaComision {
  id: number;
  nombre: string;
  precio: number;
  porcentajeComision: number;
}

// Una fila del detalle "por item" del resumen -- una venta puntual de un
// servicio/producto/paquete (con su fecha), no un agregado por categoria
// (ver ResumenComision).
export interface DetalleComision {
  tipo: 'SERVICIO' | 'PRODUCTO' | 'PAQUETE';
  itemId: number;
  nombre: string;
  cantidad: number;
  base: number;
  comision: number;
  fecha: string;
}
