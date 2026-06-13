import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DashboardStats, DashboardChartData } from '../../core/models/dashboard.model';
import { ApiResponse } from '../../core/models/api-response.model';
import { environment } from '../../../environments/environment';

interface DashboardApiData {
  ventasHoy: number;
  ingresosHoy: number;
  citasHoy: number;
  clientesAtendidos: number;
  productosStockBajo: number;
  barberoTopNombre: string;
  barberoTopMonto: number;
  recompensasPendientes: number;
}

interface TopServicioApi {
  servicioNombre: string;
  vecesVendido: number;
  totalUnidades: number;
}

interface VentaSemanaApi {
  fecha: string;
  totalVentas: number;
  totalMonto: number;
}

interface CitaEstadoApi {
  estado: string;
  cantidad: number;
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
            ingresosHoy: d.ingresosHoy,
            productosStockBajo: d.productosStockBajo,
            barberoTopNombre: d.barberoTopNombre ?? '-',
            barberoTopMonto: d.barberoTopMonto ?? 0,
            recompensasPendientes: d.recompensasPendientes ?? 0,
          };
        }),
      );
  }

  getChartData(): Observable<DashboardChartData> {
    const emptyList = <T>() => of({ data: [] as T[], success: true } as ApiResponse<T[]>);
    return forkJoin({
      topServicios: this.http.get<ApiResponse<TopServicioApi[]>>(`${this.reportsUrl}/top-services`).pipe(catchError(() => emptyList<TopServicioApi>())),
      ventas:       this.http.get<ApiResponse<VentaSemanaApi[]>>(`${this.reportsUrl}/sales`).pipe(catchError(() => emptyList<VentaSemanaApi>())),
      citas:        this.http.get<ApiResponse<CitaEstadoApi[]>>(`${this.reportsUrl}/appointments`).pipe(catchError(() => emptyList<CitaEstadoApi>())),
    }).pipe(
      map(({ topServicios, ventas, citas }) => {
        const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

        const ventasSemana = (ventas.data ?? [])
          .slice(0, 7)
          .map((v: VentaSemanaApi) => {
            const d = new Date(v.fecha);
            return { dia: dias[d.getDay()], monto: v.totalMonto };
          });

        const serviciosMasVendidos = (topServicios.data ?? [])
          .slice(0, 5)
          .map((s: TopServicioApi) => ({ nombre: s.servicioNombre, cantidad: s.vecesVendido }));

        const citasPorEstado = (citas.data ?? [])
          .map((c: CitaEstadoApi) => ({ estado: c.estado, cantidad: c.cantidad }));

        return { ventasSemana, serviciosMasVendidos, citasPorEstado };
      }),
    );
  }
}
