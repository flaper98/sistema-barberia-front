export interface Worker {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  especialidad: string;
  estado: boolean;
  totalGenerado: number;
  serviciosRealizados: number;
  createdAt: string;
  avatar?: string;
}

/** Versión mínima para selectores (ej. elegir quién atendió al vender) — sin datos de comisión/ventas. */
export interface WorkerSelector {
  id: number;
  nombre: string;
  apellido: string;
  especialidad: string;
  avatar?: string;
}

export interface WorkerFilters {
  search?: string;
  estado?: boolean;
  especialidad?: string;
}
