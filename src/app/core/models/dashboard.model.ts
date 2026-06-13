export interface DashboardStats {
  ventasHoy: number;
  citasHoy: number;
  clientesAtendidos: number;
  ingresosHoy: number;
  productosStockBajo: number;
  barberoTopNombre: string;
  barberoTopMonto: number;
  recompensasPendientes: number;
}

export interface DashboardChartData {
  ventasSemana: { dia: string; monto: number }[];
  serviciosMasVendidos: { nombre: string; cantidad: number }[];
  citasPorEstado: { estado: string; cantidad: number }[];
}
