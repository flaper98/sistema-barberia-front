import { Component, OnInit } from '@angular/core';
import { Appointment, AppointmentStatus } from '../../../core/models/appointment.model';
import { AppointmentService } from '../../../data/repositories/appointment.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

@Component({
  selector: 'app-appointment-list',
  standalone: false,
  templateUrl: './appointment-list.component.html',
  styleUrls: ['./appointment-list.component.scss'],
})
export class AppointmentListComponent implements OnInit {
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  selectedDate: string = new Date().toISOString().split('T')[0];
  loading = true;

  readonly statuses: AppointmentStatus[] = ['PENDIENTE', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA', 'NO_ASISTIO'];

  timeSlots: string[] = [];

  constructor(
    private apptService: AppointmentService,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {}

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
    });
  }

  onDateChange(date: Date | null): void {
    if (!date) return;
    this.selectedDate = date.toISOString().split('T')[0];
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
    this.apptService.updateStatus(appt.id, status).subscribe(() => {
      appt.estado = status;
      this.snackBar.open('Estado actualizado', '', { duration: 2000 });
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
