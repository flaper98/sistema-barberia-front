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
  serviciosMasVendidos: { nombre: string; cantidad: number }[];
}
