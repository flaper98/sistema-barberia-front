import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PublicBookingService } from '../../../data/repositories/public-booking.service';
import { PublicAppointmentResponse } from '../../../core/models/public-booking.model';

@Component({
  selector: 'app-booking-success',
  standalone: false,
  templateUrl: './booking-success.component.html',
  styleUrls: ['./booking-success.component.scss'],
})
export class BookingSuccessComponent implements OnInit {
  loading = true;
  appointment: PublicAppointmentResponse | null = null;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: PublicBookingService,
  ) {}

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code');
    if (!code) { this.router.navigate(['/reservar-cita']); return; }

    this.bookingService.getAppointmentByCode(code).subscribe({
      next:  appt => { this.appointment = appt; this.loading = false; },
      error: ()   => { this.error = true; this.loading = false; },
    });
  }

  nuevaCita(): void {
    this.router.navigate(['/reservar-cita']);
  }
}
