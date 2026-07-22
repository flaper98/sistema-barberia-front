import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DashboardStats, DashboardChartData } from '../../core/models/dashboard.model';
import { ApiResponse } from '../../core/models/api-response.model';
import { environment } from '../../../environments/environment';
import { toLocalDateStr } from '../../core/utils/date.util';

interface DashboardApiData {
  ventasHoy: number;
  ingresosHoy: number | null;
  comisionHoy: number | null;
  citasHoy: number;
  clientesAtendidos: number;
  productosStockBajo: number;
  barberoTopNombre: string | null;
  barberoTopMonto: number;
  recompensasPendientes: number;
}

interface TopServicioApi {
  nombre: string;
  vecesVendido: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly reportsUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http
      .get<ApiResponse<DashboardApiData>>(`${this.reportsUrl}/dashboard`)
      .pipe(
        map(r => {
          const d = r.data!;
          return {
            ventasHoy: d.ventasHoy,
            citasHoy: d.citasHoy,
            clientesAtendidos: d.clientesAtendidos,
            ingresosHoy: d.ingresosHoy ?? 0,
            comisionHoy: d.comisionHoy ?? undefined,
            productosStockBajo: d.productosStockBajo,
            barberoTopNombre: d.barberoTopNombre ?? '-',
            barberoTopMonto: d.barberoTopMonto ?? 0,
            recompensasPendientes: d.recompensasPendientes ?? 0,
          };
        }),
      );
  }

  getChartData(): Observable<DashboardChartData> {
    const hoy = toLocalDateStr(new Date());
    const params = new HttpParams().set('desde', hoy).set('hasta', hoy).set('limit', 30);
    return this.http
      .get<ApiResponse<TopServicioApi[]>>(`${this.reportsUrl}/top-services`, { params })
      .pipe(
        map(r => ({
          serviciosMasVendidos: (r.data ?? []).map(s => ({ nombre: s.nombre, cantidad: s.vecesVendido })),
        })),
        catchError(() => of({ serviciosMasVendidos: [] })),
      );
  }
}
