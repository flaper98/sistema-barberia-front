import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Appointment, AppointmentFilters, AppointmentStatus } from '../../core/models/appointment.model';
import { Sale, QuickSaleForm } from '../../core/models/sale.model';
import { ApiResponse, PageResponse } from '../../core/models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly url = `${environment.apiUrl}/appointments`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 50): Observable<Appointment[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<Appointment>>>(this.url, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  getById(id: number): Observable<Appointment> {
    return this.http
      .get<ApiResponse<Appointment>>(`${this.url}/${id}`)
      .pipe(map(r => r.data!));
  }

  getByDate(fecha: string): Observable<Appointment[]> {
    const params = new HttpParams().set('fecha', fecha).set('page', 0).set('size', 100);
    return this.http
      .get<ApiResponse<PageResponse<Appointment>>>(this.url, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  getByWorker(barberoId: number, page = 0, size = 50): Observable<Appointment[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<Appointment>>>(`${this.url}/by-worker/${barberoId}`, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  search(filters: AppointmentFilters): Observable<Appointment[]> {
    let params = new HttpParams().set('page', 0).set('size', 100);
    if (filters.fecha) params = params.set('fecha', filters.fecha);
    if (filters.barberoId) params = params.set('barberoId', filters.barberoId);
    if (filters.estado) params = params.set('estado', filters.estado);
    return this.http
      .get<ApiResponse<PageResponse<Appointment>>>(this.url, { params })
      .pipe(map(r => {
        let result = r.data?.content ?? [];
        if (filters.clienteId) result = result.filter(a => a.clienteId === filters.clienteId);
        return result.sort((a, b) => a.hora.localeCompare(b.hora));
      }));
  }

  create(data: Omit<Appointment, 'id' | 'createdAt'>): Observable<Appointment> {
    return this.http
      .post<ApiResponse<Appointment>>(this.url, data)
      .pipe(map(r => r.data!));
  }

  update(id: number, data: Partial<Appointment>): Observable<Appointment> {
    return this.http
      .put<ApiResponse<Appointment>>(`${this.url}/${id}`, data)
      .pipe(map(r => r.data!));
  }

  updateStatus(id: number, estado: AppointmentStatus): Observable<Appointment> {
    return this.http
      .patch<ApiResponse<Appointment>>(`${this.url}/${id}/status`, { estado })
      .pipe(map(r => r.data!));
  }

  delete(id: number): Observable<void> {
    return this.updateStatus(id, 'CANCELADA').pipe(map(() => undefined));
  }

  convertToSale(citaId: number, form: QuickSaleForm): Observable<Sale> {
    const body = {
      clienteId: form.clienteId ?? null,
      barberoId: form.barberoId,
      pagos: form.pagos ?? null,
      descuento: form.descuento ?? 0,
      notas: form.notas ?? null,
      items: form.items.map(i => ({
        tipo: i.tipo,
        itemId: i.itemId,
        nombre: i.nombre,
        precio: i.precio,
        cantidad: i.cantidad,
      })),
    };
    return this.http
      .post<ApiResponse<Sale>>(`${this.url}/${citaId}/convert-to-sale`, body)
      .pipe(map(r => r.data!));
  }
}
