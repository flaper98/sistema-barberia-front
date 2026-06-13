export type AppointmentStatus = 'PENDIENTE' | 'CONFIRMADA' | 'ATENDIDA' | 'CANCELADA' | 'NO_ASISTIO';

export interface Appointment {
  id: number;
  clienteId: number;
  clienteNombre: string;
  barberoId: number;
  barberoNombre: string;
  servicios: AppointmentService[];
  fecha: string;
  hora: string;
  estado: AppointmentStatus;
  totalEstimado: number;
  notas?: string;
  appointmentSource?: string;
  appointmentCode?: string;
  createdAt: string;
}

export interface AppointmentService {
  servicioId: number;
  servicioNombre: string;
  precio: number;
  duracionMinutos: number;
}

export interface AppointmentFilters {
  fecha?: string;
  barberoId?: number;
  clienteId?: number;
  estado?: AppointmentStatus;
}
