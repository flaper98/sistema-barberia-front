export type NotificationType = 'CITA_ASIGNADA' | 'VENTA_PENDIENTE';

export interface AppNotification {
  id: number;
  tipo: NotificationType;
  mensaje: string;
  entidadTipo?: string;
  entidadId?: number;
  leida: boolean;
  fecha: string;
}
