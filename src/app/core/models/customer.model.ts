export interface Customer {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  fechaNacimiento?: string;
  cantidadSellos: number;
  recompensasDisponibles: number;
  descripcionRecompensa?: string;
  ultimaVisita?: string;
  estado: boolean;
  createdAt: string;
  notas?: string;
}

export interface CustomerFilters {
  search?: string;
  estado?: boolean;
  sellosMin?: number | null;
  recompensa?: 'con' | 'sin';
  inactividad?: 'nunca' | '30' | '60' | '90';
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  size?: number;
}
