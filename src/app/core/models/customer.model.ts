export interface Customer {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  // Opcional a proposito: la columna es UNIQUE en la base, y mandar ''
  // (en vez de simplemente no mandar el campo) hace que dos clientes sin
  // correo choquen entre si -- '' no es lo mismo que NULL para un indice
  // unico en MySQL (NULL no choca nunca, '' == '' si).
  correo?: string;
  fechaNacimiento?: string;
  cantidadSellos: number;
  recompensasDisponibles: number;
  descripcionRecompensa?: string;
  ultimaVisita?: string;
  estado: boolean;
  createdAt: string;
  notas?: string;
}

// Version minima para selectores (ej. adjuntar un cliente a una solicitud
// de venta que arma un barbero) -- sin telefono ni sellos de fidelizacion,
// que vienen de un endpoint sin depender del permiso del modulo Clientes
// (ver ClienteController#listarParaSelector). Un Customer completo
// tambien cumple esta forma, asi que ambos pueden convivir donde solo se
// usan estos 3 campos (ver quick-sale.component).
export interface CustomerSelector {
  id: number;
  nombre: string;
  apellido: string;
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
