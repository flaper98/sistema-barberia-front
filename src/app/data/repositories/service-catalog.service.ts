import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BarberService, ServiceFilters } from '../../core/models/service.model';
import { ApiResponse, PageResponse } from '../../core/models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ServiceCatalogService {
  private readonly url = `${environment.apiUrl}/services`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<BarberService[]> {
    const params = new HttpParams().set('page', 0).set('size', 200);
    return this.http
      .get<ApiResponse<PageResponse<BarberService>>>(this.url, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  getActive(): Observable<BarberService[]> {
    return this.getAll().pipe(map(s => s.filter(sv => sv.estado)));
  }

  getById(id: number): Observable<BarberService> {
    return this.http
      .get<ApiResponse<BarberService>>(`${this.url}/${id}`)
      .pipe(map(r => r.data!));
  }

  search(filters: ServiceFilters): Observable<BarberService[]> {
    let params = new HttpParams().set('page', 0).set('size', 200);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.categoria) params = params.set('categoria', filters.categoria);
    return this.http
      .get<ApiResponse<PageResponse<BarberService>>>(this.url, { params })
      .pipe(map(r => {
        let result = r.data?.content ?? [];
        if (filters.estado !== undefined) result = result.filter(sv => sv.estado === filters.estado);
        return result;
      }));
  }

  create(data: Omit<BarberService, 'id'>): Observable<BarberService> {
    return this.http
      .post<ApiResponse<BarberService>>(this.url, data)
      .pipe(map(r => r.data!));
  }

  update(id: number, data: Partial<BarberService>): Observable<BarberService> {
    return this.http
      .put<ApiResponse<BarberService>>(`${this.url}/${id}`, data)
      .pipe(map(r => r.data!));
  }

  toggleStatus(id: number): Observable<BarberService> {
    return this.http
      .patch<ApiResponse<BarberService>>(`${this.url}/${id}/status`, {})
      .pipe(map(r => r.data!));
  }

  delete(id: number): Observable<void> {
    return this.toggleStatus(id).pipe(map(() => undefined));
  }
}
