export type FinanceType     = 'INGRESO' | 'EGRESO';
export type FinanceCategory = 'VENTA' | 'ALQUILER' | 'SALARIO' | 'SUMINISTROS' | 'SERVICIOS' | 'MANTENIMIENTO' | 'OTRO';

export interface FinanceEntry {
  id: number;
  tipo: FinanceType;
  categoria: FinanceCategory;
  descripcion: string;
  monto: number;
  fecha: string;
  usuarioId: number;
  usuarioNombre: string;
  referencia?: string;
}

export interface FinanceSummary {
  totalIngresos: number;
  totalEgresos: number;
  utilidad: number;
  periodo: string;
}

export interface FinanceFilters {
  tipo?: FinanceType;
  categoria?: FinanceCategory;
  fechaDesde?: string;
  fechaHasta?: string;
}
