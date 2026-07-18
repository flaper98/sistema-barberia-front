export type UsuarioRol = 'ADMIN' | 'BARBER' | 'CASHIER' | 'RECEPTION';

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  email: string;
  rol: UsuarioRol;
  estado: boolean;
  avatar?: string;
  barberoId?: number | null;
  ultimoAcceso?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsuarioRequest {
  nombre: string;
  apellido: string;
  email: string;
  password?: string;
  rol: UsuarioRol;
  avatar?: string;
  barberoId?: number | null;
}
