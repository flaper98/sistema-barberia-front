export type UserRole = 'ADMIN' | 'BARBER' | 'CASHIER' | 'RECEPTION';

export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: UserRole;
  estado: boolean;
  avatar?: string;
  createdAt: string;
  barberoId?: number;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

/** Respuesta exacta del backend POST /api/auth/login (campo data) */
export interface LoginApiResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: number;
  nombre: string;
  email: string;
  rol: string;
  avatar?: string;
}

/** Respuesta exacta del backend GET /api/auth/me (campo data) */
export interface AuthMeResponse {
  id: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  email: string;
  rol: string;
  avatar?: string;
  barberoId?: number;
  estado: boolean;
  ultimoAcceso?: string;
  createdAt: string;
}

/** Estado interno del AuthService */
export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
  expiresIn?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
