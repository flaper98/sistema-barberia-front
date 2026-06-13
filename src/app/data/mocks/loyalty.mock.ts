import { LoyaltyAccount, LoyaltyMovement, Reward, LoyaltyConfig } from '../../core/models/loyalty.model';

export const MOCK_LOYALTY_ACCOUNTS: LoyaltyAccount[] = [
  { clienteId: 1, clienteNombre: 'Juan García',      sellosActuales: 3, sellosNecesarios: 5, recompensasCanjeadas: 1, recompensasDisponibles: 0, ultimoMovimiento: '2024-06-08' },
  { clienteId: 2, clienteNombre: 'Pedro Martínez',   sellosActuales: 5, sellosNecesarios: 5, recompensasCanjeadas: 2, recompensasDisponibles: 1, ultimoMovimiento: '2024-06-09' },
  { clienteId: 3, clienteNombre: 'Luis Rodríguez',   sellosActuales: 1, sellosNecesarios: 5, recompensasCanjeadas: 0, recompensasDisponibles: 0, ultimoMovimiento: '2024-06-01' },
  { clienteId: 4, clienteNombre: 'Roberto Sánchez',  sellosActuales: 10, sellosNecesarios: 5, recompensasCanjeadas: 4, recompensasDisponibles: 2, ultimoMovimiento: '2024-06-07' },
  { clienteId: 5, clienteNombre: 'Diego Flores',     sellosActuales: 0, sellosNecesarios: 5, recompensasCanjeadas: 0, recompensasDisponibles: 0, ultimoMovimiento: '2024-05-20' },
  { clienteId: 6, clienteNombre: 'Manuel López',     sellosActuales: 4, sellosNecesarios: 5, recompensasCanjeadas: 1, recompensasDisponibles: 0, ultimoMovimiento: '2024-06-05' },
  { clienteId: 7, clienteNombre: 'Tomás Herrera',    sellosActuales: 7, sellosNecesarios: 5, recompensasCanjeadas: 3, recompensasDisponibles: 1, ultimoMovimiento: '2024-06-09' },
];

export const MOCK_LOYALTY_MOVEMENTS: LoyaltyMovement[] = [
  { id: 1, clienteId: 2, clienteNombre: 'Pedro Martínez',  tipo: 'GANADO',   cantidad: 1, motivo: 'Servicio atendido - Venta #1', fecha: '2024-06-09', ventaId: 1 },
  { id: 2, clienteId: 1, clienteNombre: 'Juan García',     tipo: 'GANADO',   cantidad: 1, motivo: 'Servicio atendido - Venta #2', fecha: '2024-06-09', ventaId: 2 },
  { id: 3, clienteId: 4, clienteNombre: 'Roberto Sánchez', tipo: 'GANADO',   cantidad: 1, motivo: 'Servicio atendido - Venta #3', fecha: '2024-06-09', ventaId: 3 },
  { id: 4, clienteId: 4, clienteNombre: 'Roberto Sánchez', tipo: 'CANJEADO', cantidad: 5, motivo: 'Recompensa: Corte gratis',      fecha: '2024-06-07' },
  { id: 5, clienteId: 7, clienteNombre: 'Tomás Herrera',   tipo: 'GANADO',   cantidad: 1, motivo: 'Servicio atendido',            fecha: '2024-06-05' },
];

export const MOCK_REWARDS: Reward[] = [
  { id: 1, tipo: 'CORTE_GRATIS',  descripcion: 'Corte clásico gratis',        sellosRequeridos: 5,  activo: true  },
  { id: 2, tipo: 'DESCUENTO_50',  descripcion: '50% de descuento en cualquier servicio', sellosRequeridos: 5,  activo: true  },
  { id: 3, tipo: 'SORTEO',        descripcion: 'Participación en sorteo mensual',         sellosRequeridos: 10, activo: true  },
  { id: 4, tipo: 'PRODUCTO_GRATIS', descripcion: 'Producto de cuidado gratis',           sellosRequeridos: 8,  activo: false },
];

export const MOCK_LOYALTY_CONFIG: LoyaltyConfig = {
  sellosNecesarios: 5,
  sellosParGanancia: 1,
  recompensasActivas: MOCK_REWARDS.filter(r => r.activo),
};
