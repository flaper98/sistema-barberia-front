import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Worker, WorkerFilters } from '../../core/models/worker.model';
import { ApiResponse, PageResponse } from '../../core/models/api-response.model';
import { environment } from '../../../environments/environment';

export interface WorkerSummary {
  barberoId: number;
  nombreCompleto: string;
  porcentajeComision: number;
  totalVentas: number;
  ingresosGenerados: number;
  comisionCalculada: number;
  serviciosRealizados: number;
  periodo: string;
}

@Injectable({ providedIn: 'root' })
export class WorkerService {
  private readonly url = `${environment.apiUrl}/workers`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 100): Observable<Worker[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<Worker>>>(this.url, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  getActive(): Observable<Worker[]> {
    const params = new HttpParams().set('page', 0).set('size', 100);
    return this.http
      .get<ApiResponse<PageResponse<Worker>>>(this.url, { params })
      .pipe(map(r => (r.data?.content ?? []).filter(w => w.estado)));
  }

  getById(id: number): Observable<Worker> {
    return this.http
      .get<ApiResponse<Worker>>(`${this.url}/${id}`)
      .pipe(map(r => r.data!));
  }

  search(filters: WorkerFilters): Observable<Worker[]> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    return this.http
      .get<ApiResponse<PageResponse<Worker>>>(this.url, { params })
      .pipe(map(r => {
        let result = r.data?.content ?? [];
        if (filters.estado !== undefined) result = result.filter(w => w.estado === filters.estado);
        if (filters.especialidad) result = result.filter(w => w.especialidad?.toLowerCase().includes(filters.especialidad!.toLowerCase()));
        return result;
      }));
  }

  create(data: Omit<Worker, 'id' | 'createdAt' | 'totalGenerado' | 'serviciosRealizados'>): Observable<Worker> {
    return this.http
      .post<ApiResponse<Worker>>(this.url, data)
      .pipe(map(r => r.data!));
  }

  update(id: number, data: Partial<Worker>): Observable<Worker> {
    return this.http
      .put<ApiResponse<Worker>>(`${this.url}/${id}`, data)
      .pipe(map(r => r.data!));
  }

  toggleStatus(id: number, estado: boolean): Observable<Worker> {
    return this.http
      .patch<ApiResponse<Worker>>(`${this.url}/${id}/status`, { estado })
      .pipe(map(r => r.data!));
  }

  delete(id: number): Observable<void> {
    return this.toggleStatus(id, false).pipe(map(() => undefined));
  }

  getSummary(id: number): Observable<WorkerSummary> {
    return this.http
      .get<ApiResponse<WorkerSummary>>(`${this.url}/${id}/summary`)
      .pipe(map(r => r.data!));
  }
}
