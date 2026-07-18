import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { BarberService } from '../../core/models/service.model';
import { Worker } from '../../core/models/worker.model';
import {
  AvailabilityResponse,
  AvailableTimeSlot,
  WorkerAvailability,
  PublicAppointmentRequest,
} from '../../core/models/public-booking.model';
import { PublicBookingService } from '../../data/repositories/public-booking.service';
import { toLocalDateStr } from '../../core/utils/date.util';

@Component({
  selector: 'app-public-booking',
  standalone: false,
  templateUrl: './public-booking.component.html',
  styleUrls: ['./public-booking.component.scss'],
})
export class PublicBookingComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;

  // State
  loadingInitial = true;
  loadingAvailability = false;
  submitting = false;

  services: BarberService[] = [];
  workers: Worker[] = [];
  selectedServices: BarberService[] = [];
  selectedWorker: Worker | null = null;
  anyWorker = false;

  availability: AvailabilityResponse | null = null;
  selectedSlot: AvailableTimeSlot | null = null;
  selectedWorkerId: number | null = null;

  // Forms
  serviceForm!: FormGroup;
  workerForm!: FormGroup;
  dateForm!: FormGroup;
  customerForm!: FormGroup;

  readonly minDate = new Date();

  constructor(
    private fb: FormBuilder,
    private bookingService: PublicBookingService,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.serviceForm  = this.fb.group({ _dummy: [null] });
    this.workerForm   = this.fb.group({ _dummy: [null] });
    this.dateForm     = this.fb.group({ fecha: [null, Validators.required] });
    this.customerForm = this.fb.group({
      nombre:   ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{9,15}$/)]],
      correo:   ['', Validators.email],
      notas:    ['', Validators.maxLength(300)],
    });

    forkJoin({
      services: this.bookingService.getServices(),
      workers:  this.bookingService.getWorkers(),
    }).subscribe({
      next: ({ services, workers }) => {
        this.services = services;
        this.workers  = workers;
        this.loadingInitial = false;
      },
      error: () => {
        this.loadingInitial = false;
        this.snackBar.open('Error al cargar datos. Intenta más tarde.', 'Cerrar', { duration: 4000 });
      },
    });
  }

  // — Paso 1: Servicios —
  toggleService(service: BarberService): void {
    const idx = this.selectedServices.findIndex(s => s.id === service.id);
    if (idx > -1) this.selectedServices.splice(idx, 1);
    else this.selectedServices.push(service);
  }

  isServiceSelected(service: BarberService): boolean {
    return this.selectedServices.some(s => s.id === service.id);
  }

  get totalEstimado(): number {
    return this.selectedServices.reduce((a, s) => a + s.precio, 0);
  }

  get duracionTotal(): number {
    return this.selectedServices.reduce((a, s) => a + s.duracionMinutos, 0);
  }

  canGoToStep2(): boolean {
    return this.selectedServices.length > 0;
  }

  goToStep2(): void {
    if (!this.canGoToStep2()) {
      this.snackBar.open('Selecciona al menos un servicio', '', { duration: 2000 });
      return;
    }
    // Resetear disponibilidad si cambian servicios
    this.availability = null;
    this.selectedSlot = null;
    this.stepper.next();
  }

  // — Paso 2: Barbero —
  selectWorker(worker: Worker): void {
    this.selectedWorker = worker;
    this.anyWorker = false;
    this.availability = null;
    this.selectedSlot = null;
  }

  selectAnyWorker(): void {
    this.selectedWorker = null;
    this.anyWorker = true;
    this.availability = null;
    this.selectedSlot = null;
  }

  isWorkerSelected(worker: Worker): boolean {
    return !this.anyWorker && this.selectedWorker?.id === worker.id;
  }

  canGoToStep3(): boolean {
    return this.selectedWorker !== null || this.anyWorker;
  }

  goToStep3(): void {
    if (!this.canGoToStep3()) {
      this.snackBar.open('Selecciona un barbero o "cualquier barbero"', '', { duration: 2000 });
      return;
    }
    this.stepper.next();
  }

  // — Paso 3: Fecha y horario —
  onDateChange(): void {
    const fecha = this.dateForm.value.fecha;
    if (!fecha) return;

    const dateStr = fecha instanceof Date ? toLocalDateStr(fecha) : fecha;
    this.selectedSlot = null;
    this.availability = null;
    this.loadingAvailability = true;

    this.bookingService.getAvailability({
      date: dateStr,
      serviceIds: this.selectedServices.map(s => s.id),
      workerId: this.selectedWorker?.id,
    }).pipe(finalize(() => this.loadingAvailability = false))
      .subscribe({
        next: data => { this.availability = data; },
        error: () => this.snackBar.open('Error al consultar disponibilidad', 'Cerrar', { duration: 3000 }),
      });
  }

  selectSlot(slot: AvailableTimeSlot, workerId: number): void {
    this.selectedSlot = slot;
    this.selectedWorkerId = workerId;
  }

  isSlotSelected(slot: AvailableTimeSlot, workerId: number): boolean {
    return this.selectedSlot?.startTime === slot.startTime && this.selectedWorkerId === workerId;
  }

  get allWorkerSlots(): WorkerAvailability[] {
    return this.availability?.availableSlots ?? [];
  }

  get noSlotsAvailable(): boolean {
    return this.allWorkerSlots.length === 0 || this.allWorkerSlots.every(ws => ws.slots.length === 0);
  }

  canGoToStep4(): boolean {
    return !!this.selectedSlot && !!this.selectedWorkerId;
  }

  goToStep4(): void {
    if (!this.canGoToStep4()) {
      this.snackBar.open('Selecciona un horario disponible', '', { duration: 2000 });
      return;
    }
    this.stepper.next();
  }

  // — Paso 4: Datos del cliente —
  canGoToStep5(): boolean {
    return this.customerForm.valid;
  }

  goToStep5(): void {
    this.customerForm.markAllAsTouched();
    if (!this.canGoToStep5()) return;
    this.stepper.next();
  }

  // — Paso 5: Confirmación —
  get selectedWorkerName(): string {
    if (this.anyWorker && this.availability) {
      const w = this.availability.availableSlots.find(ws => ws.workerId === this.selectedWorkerId);
      return w?.workerName ?? 'Asignado automáticamente';
    }
    return this.selectedWorker ? `${this.selectedWorker.nombre} ${this.selectedWorker.apellido}` : '';
  }

  get selectedDateFormatted(): string {
    const fecha = this.dateForm.value.fecha;
    if (!fecha) return '';
    const d = fecha instanceof Date ? fecha : new Date(fecha);
    return d.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  confirmar(): void {
    if (this.submitting) return;

    const cv = this.customerForm.value;
    const dateValue = this.dateForm.value.fecha;
    const dateStr = dateValue instanceof Date ? toLocalDateStr(dateValue) : dateValue;

    const request: PublicAppointmentRequest = {
      customer: {
        nombre:   cv.nombre.trim(),
        apellido: cv.apellido.trim(),
        telefono: cv.telefono.trim(),
        correo:   cv.correo?.trim() || undefined,
      },
      workerId:        this.selectedWorkerId!,
      serviceIds:      this.selectedServices.map(s => s.id),
      appointmentDate: dateStr,
      startTime:       this.selectedSlot!.startTime,
      notes:           cv.notas?.trim() || undefined,
    };

    this.submitting = true;
    this.bookingService.createAppointment(request)
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: res => this.router.navigate(['/reservar-cita/confirmacion', res.appointmentCode]),
        error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 5000 }),
      });
  }

  // — Helpers de validación —
  fieldError(form: FormGroup, field: string): string {
    const ctrl = form.get(field);
    if (!ctrl?.touched || !ctrl.errors) return '';
    if (ctrl.errors['required'])  return 'Campo obligatorio';
    if (ctrl.errors['minlength']) return `Mínimo ${ctrl.errors['minlength'].requiredLength} caracteres`;
    if (ctrl.errors['pattern'])   return 'Formato inválido';
    if (ctrl.errors['email'])     return 'Email inválido';
    if (ctrl.errors['maxlength']) return `Máximo ${ctrl.errors['maxlength'].requiredLength} caracteres`;
    return 'Valor inválido';
  }
}
