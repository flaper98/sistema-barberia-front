export interface Customer {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  fechaNacimiento?: string;
  cantidadSellos: number;
  recompensasDisponibles: number;
  ultimaVisita?: string;
  estado: boolean;
  createdAt: string;
  notas?: string;
}

export interface CustomerFilters {
  search?: string;
  estado?: boolean;
  page?: number;
  size?: number;
}
