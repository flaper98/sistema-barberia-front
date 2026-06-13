import { Pipe, PipeTransform } from '@angular/core';
import { Appointment } from '../../core/models/appointment.model';

@Pipe({ name: 'countByStatus', standalone: false })
export class CountByStatusPipe implements PipeTransform {
  transform(appointments: Appointment[], status: string): number {
    return appointments.filter(a => a.estado === status).length;
  }
}
