import { Component, OnInit } from '@angular/core';
import { Appointment, AppointmentStatus } from '../../../core/models/appointment.model';
import { AppointmentService } from '../../../data/repositories/appointment.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { toLocalDateStr } from '../../../core/utils/date.util';

@Component({
  selector: 'app-appointment-list',
  standalone: false,
  templateUrl: './appointment-list.component.html',
  styleUrls: ['./appointment-list.component.scss'],
})
export class AppointmentListComponent implements OnInit {
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  selectedDate: string = toLocalDateStr(new Date());
  loading = true;

  readonly statuses: AppointmentStatus[] = ['PENDIENTE', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA', 'NO_ASISTIO'];

  timeSlots: string[] = [];

  constructor(
    private apptService: AppointmentService,
    private snackBar: MatSnackBar,
    private router: Router,
    private authService: AuthService,
    private permissionService: PermissionService,
  ) {}

  get puedeEditar(): boolean {
    return this.authService.hasRole(['ADMIN']) || this.permissionService.canEdit('CITAS');
  }

  ngOnInit(): void {
    this.generateTimeSlots();
    this.loadAppointments();
  }

  generateTimeSlots(): void {
    for (let h = 8; h <= 20; h++) {
      this.timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
      if (h < 20) this.timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
    }
  }

  loadAppointments(): void {
    this.loading = true;
    this.apptService.getByDate(this.selectedDate).subscribe({
      next: (appts) => {
        this.appointments = appts;
        this.filteredAppointments = appts;
        this.loading = false;
      },
      error: (err: Error) => {
        this.loading = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  onDateChange(date: Date | null): void {
    if (!date) return;
    this.selectedDate = toLocalDateStr(date);
    this.loadAppointments();
  }

  onPickerChange(event: MatDatepickerInputEvent<Date>): void {
    this.onDateChange(event.value);
  }

  goToday(): void {
    this.onDateChange(new Date());
  }

  getServiceNames(appt: Appointment): string {
    return appt.servicios.map(s => s.servicioNombre).join(', ');
  }

  changeStatus(appt: Appointment, status: AppointmentStatus): void {
    this.apptService.updateStatus(appt.id, status).subscribe({
      next: () => {
        appt.estado = status;
        this.snackBar.open('Estado actualizado', '', { duration: 2000 });
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
  }

  getApptForSlot(slot: string): Appointment | undefined {
    return this.appointments.find(a => a.hora === slot);
  }

  goToNewAppointment(): void {
    this.router.navigate(['/appointments/new']);
  }

  getStatusClass(estado: string): string {
    return estado.toLowerCase().replace('_', '-');
  }

  get selectedDateObj(): Date {
    return new Date(this.selectedDate + 'T00:00:00');
  }

  getDateOffset(days: number): Date {
    const d = new Date(this.selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d;
  }
}
