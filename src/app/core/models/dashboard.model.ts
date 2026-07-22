export interface DashboardStats {
  ventasHoy: number;
  citasHoy: number;
  clientesAtendidos: number;
  ingresosHoy: number;
  // Solo viene con valor para un BARBER (el backend lo calcula aparte de
  // ingresosHoy) -- un barbero no puede ver el total vendido, solo lo que
  // le corresponde de comision.
  comisionHoy?: number;
  productosStockBajo: number;
  barberoTopNombre: string;
  barberoTopMonto: number;
  recompensasPendientes: number;
}

export interface DashboardChartData {
  serviciosMasVendidos: { nombre: string; cantidad: number }[];
}
