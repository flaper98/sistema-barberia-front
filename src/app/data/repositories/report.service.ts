import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CitaReporte,
  LoyaltyReporte,
  TopProductoReporte,
  TopServicioReporte,
  VentaPorBarbero,
  VentaReporte,
} from '../../core/models/report.model';
import { FinanceSummary } from '../../core/models/finance.model';
import { ApiResponse } from '../../core/models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly url = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  private buildParams(desde: string, hasta: string, extra?: Record<string, string | number | undefined | null>): HttpParams {
    let params = new HttpParams().set('desde', desde).set('hasta', hasta);
    if (extra) {
      for (const [key, value] of Object.entries(extra)) {
        if (value !== undefined && value !== null) params = params.set(key, value);
      }
    }
    return params;
  }

  getSales(desde: string, hasta: string, estado?: string, barberoId?: number | null): Observable<VentaReporte[]> {
    const params = this.buildParams(desde, hasta, { estado, barberoId });
    return this.http
      .get<ApiResponse<VentaReporte[]>>(`${this.url}/sales`, { params })
      .pipe(map(r => r.data ?? []));
  }

  getSalesByWorker(desde: string, hasta: string, barberoId?: number | null): Observable<VentaPorBarbero[]> {
    const params = this.buildParams(desde, hasta, { barberoId });
    return this.http
      .get<ApiResponse<VentaPorBarbero[]>>(`${this.url}/sales-by-worker`, { params })
      .pipe(map(r => r.data ?? []));
  }

  getTopServices(desde: string, hasta: string, limit = 10, barberoId?: number | null): Observable<TopServicioReporte[]> {
    const params = this.buildParams(desde, hasta, { limit, barberoId });
    return this.http
      .get<ApiResponse<TopServicioReporte[]>>(`${this.url}/top-services`, { params })
      .pipe(map(r => r.data ?? []));
  }

  getTopProducts(desde: string, hasta: string, limit = 10, barberoId?: number | null): Observable<TopProductoReporte[]> {
    const params = this.buildParams(desde, hasta, { limit, barberoId });
    return this.http
      .get<ApiResponse<TopProductoReporte[]>>(`${this.url}/top-products`, { params })
      .pipe(map(r => r.data ?? []));
  }

  getAppointments(desde: string, hasta: string, estado?: string, barberoId?: number | null): Observable<CitaReporte[]> {
    const params = this.buildParams(desde, hasta, { estado, barberoId });
    return this.http
      .get<ApiResponse<CitaReporte[]>>(`${this.url}/appointments`, { params })
      .pipe(map(r => r.data ?? []));
  }

  getFinanceSummary(desde: string, hasta: string): Observable<FinanceSummary> {
    const params = this.buildParams(desde, hasta);
    return this.http
      .get<ApiResponse<FinanceSummary>>(`${this.url}/finance`, { params })
      .pipe(map(r => r.data!));
  }

  getLoyaltySummary(): Observable<LoyaltyReporte> {
    return this.http
      .get<ApiResponse<LoyaltyReporte>>(`${this.url}/loyalty`)
      .pipe(map(r => r.data!));
  }
}
