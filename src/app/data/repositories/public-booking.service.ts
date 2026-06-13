import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/api-response.model';
import { BarberService } from '../../core/models/service.model';
import { Worker } from '../../core/models/worker.model';
import {
  AvailabilityRequest,
  AvailabilityResponse,
  PublicAppointmentRequest,
  PublicAppointmentResponse,
} from '../../core/models/public-booking.model';

@Injectable({ providedIn: 'root' })
export class PublicBookingService {
  private readonly base = `${environment.apiUrl}/public/booking`;

  constructor(private http: HttpClient) {}

  getServices(): Observable<BarberService[]> {
    return this.http
      .get<ApiResponse<BarberService[]>>(`${this.base}/services`)
      .pipe(map(r => r.data ?? []));
  }

  getWorkers(): Observable<Worker[]> {
    return this.http
      .get<ApiResponse<Worker[]>>(`${this.base}/workers`)
      .pipe(map(r => r.data ?? []));
  }

  getAvailability(req: AvailabilityRequest): Observable<AvailabilityResponse> {
    let params = new HttpParams()
      .set('date', req.date)
      .set('serviceIds', req.serviceIds.join(','));
    if (req.workerId) params = params.set('workerId', req.workerId);

    return this.http
      .get<ApiResponse<AvailabilityResponse>>(`${this.base}/availability`, { params })
      .pipe(map(r => r.data!));
  }

  createAppointment(request: PublicAppointmentRequest): Observable<PublicAppointmentResponse> {
    return this.http
      .post<ApiResponse<PublicAppointmentResponse>>(`${this.base}/appointments`, request)
      .pipe(map(r => r.data!));
  }

  getAppointmentByCode(code: string): Observable<PublicAppointmentResponse> {
    return this.http
      .get<ApiResponse<PublicAppointmentResponse>>(`${this.base}/appointments/${code}`)
      .pipe(map(r => r.data!));
  }
}
