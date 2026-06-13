import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FinanceEntry, FinanceFilters, FinanceSummary } from '../../core/models/finance.model';
import { ApiResponse, PageResponse } from '../../core/models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly url = `${environment.apiUrl}/finance`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 50): Observable<FinanceEntry[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<FinanceEntry>>>(this.url, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  getById(id: number): Observable<FinanceEntry> {
    return this.http
      .get<ApiResponse<FinanceEntry>>(`${this.url}/${id}`)
      .pipe(map(r => r.data!));
  }

  search(filters: FinanceFilters): Observable<FinanceEntry[]> {
    let params = new HttpParams().set('page', 0).set('size', 100);
    if (filters.tipo) params = params.set('tipo', filters.tipo);
    if (filters.categoria) params = params.set('categoria', filters.categoria);
    if (filters.fechaDesde) params = params.set('fechaDesde', filters.fechaDesde);
    if (filters.fechaHasta) params = params.set('fechaHasta', filters.fechaHasta);
    return this.http
      .get<ApiResponse<PageResponse<FinanceEntry>>>(this.url, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  getSummary(fechaDesde?: string, fechaHasta?: string): Observable<FinanceSummary> {
    let params = new HttpParams();
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);
    return this.http
      .get<ApiResponse<FinanceSummary>>(`${this.url}/summary`, { params })
      .pipe(map(r => r.data!));
  }

  create(data: Omit<FinanceEntry, 'id'>): Observable<FinanceEntry> {
    return this.http
      .post<ApiResponse<FinanceEntry>>(this.url, data)
      .pipe(map(r => r.data!));
  }

  update(id: number, data: Partial<FinanceEntry>): Observable<FinanceEntry> {
    return this.http
      .put<ApiResponse<FinanceEntry>>(`${this.url}/${id}`, data)
      .pipe(map(r => r.data!));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.url}/${id}`)
      .pipe(map(() => undefined));
  }
}
