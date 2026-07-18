export type LoyaltyMovementType = 'GANADO' | 'CANJEADO' | 'EXPIRADO' | 'AJUSTE';
export type RewardType = 'CORTE_GRATIS' | 'DESCUENTO_50' | 'SORTEO' | 'PRODUCTO_GRATIS';

export interface LoyaltyAccount {
  clienteId: number;
  clienteNombre: string;
  sellosActuales: number;
  sellosNecesarios: number;
  recompensasCanjeadas: number;
  recompensasDisponibles: number;
  descripcionRecompensa?: string;
  ultimoMovimiento?: string;
}

export interface LoyaltyMovement {
  id: number;
  clienteId: number;
  clienteNombre: string;
  tipo: LoyaltyMovementType;
  cantidad: number;
  motivo: string;
  fecha: string;
  ventaId?: number;
}

export interface Reward {
  id: number;
  tipo: RewardType;
  descripcion: string;
  sellosRequeridos: number;
  activo: boolean;
}

export interface LoyaltyConfig {
  id?: number;
  sellosNecesarios: number;
  sellosPorGanancia: number;
  descripcionRecompensa?: string;
  activo: boolean;
  updatedAt?: string;
}
