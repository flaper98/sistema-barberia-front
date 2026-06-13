import { BarberService } from './service.model';
import { Worker } from './worker.model';

export interface BookingCustomerData {
  nombre: string;
  apellido: string;
  telefono: string;
  correo?: string;
}

export interface AvailabilityRequest {
  date: string;
  serviceIds: number[];
  workerId?: number;
}

export interface AvailableTimeSlot {
  startTime: string;
  endTime: string;
}

export interface WorkerAvailability {
  workerId: number;
  workerName: string;
  slots: AvailableTimeSlot[];
}

export interface AvailabilityResponse {
  date: string;
  serviceDurationMinutes: number;
  availableSlots: WorkerAvailability[];
}

export interface PublicAppointmentRequest {
  customer: BookingCustomerData;
  workerId: number;
  serviceIds: number[];
  appointmentDate: string;
  startTime: string;
  notes?: string;
}

export interface PublicAppointmentServiceItem {
  id: number;
  name: string;
  price: number;
  durationMinutes: number;
}

export interface PublicAppointmentResponse {
  appointmentId: number;
  appointmentCode: string;
  status: string;
  customerName: string;
  workerName: string;
  services: PublicAppointmentServiceItem[];
  appointmentDate: string;
  startTime: string;
  endTime: string;
  estimatedTotal: number;
  message: string;
}

export interface BookingState {
  selectedServices: BarberService[];
  selectedWorker: Worker | null;
  anyWorker: boolean;
  selectedDate: string;
  selectedSlot: AvailableTimeSlot | null;
  selectedWorkerId: number | null;
  customer: BookingCustomerData | null;
  notes: string;
}
