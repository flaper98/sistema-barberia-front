export type ServiceCategory = 'CORTE' | 'BARBA' | 'TRATAMIENTO' | 'COLOR' | 'COMBO';

export interface BarberService {
  id: number;
  nombre: string;
  categoria: ServiceCategory;
  precio: number;
  duracionMinutos: number;
  estado: boolean;
  descripcion?: string;
}

export interface ServiceFilters {
  search?: string;
  categoria?: ServiceCategory;
  estado?: boolean;
}
