export interface VentaReporte {
  id: number;
  fecha: string;
  clienteNombre: string | null;
  barberoNombre: string;
  subtotal: number;
  descuento: number;
  total: number;
  metodoPago: string;
  estado: string;
  itemsCount: number;
}

export interface VentaPorBarbero {
  barberoId: number;
  barberoNombre: string;
  porcentajeComision: number;
  totalVentas: number;
  ingresos: number;
  comision: number;
  serviciosRealizados: number;
}

export interface TopServicioReporte {
  servicioId: number;
  nombre: string;
  categoria: string;
  vecesVendido: number;
  ingresos: number;
  precioPromedio: number;
}

export interface TopProductoReporte {
  productoId: number;
  nombre: string;
  categoria: string;
  unidadesVendidas: number;
  ingresos: number;
  stockActual: number;
}

export interface CitaReporte {
  id: number;
  fecha: string;
  hora: string;
  clienteNombre: string;
  barberoNombre: string;
  estado: string;
  totalEstimado: number;
  serviciosCount: number;
}

export interface LoyaltyReporte {
  totalClientesConCuenta: number;
  clientesConRecompensas: number;
  totalSellosOtorgados: number;
  totalRecompensasCanjeadas: number;
  totalRecompensasPendientes: number;
  promedioSellosPorCliente: number;
}

export interface ReportFilters {
  desde: string;
  hasta: string;
  barberoId?: number | null;
}
