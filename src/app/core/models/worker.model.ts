export interface Worker {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  especialidad: string;
  porcentajeComision: number;
  estado: boolean;
  totalGenerado: number;
  serviciosRealizados: number;
  createdAt: string;
  avatar?: string;
}

export interface WorkerFilters {
  search?: string;
  estado?: boolean;
  especialidad?: string;
}
