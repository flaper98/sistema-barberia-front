import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResumenComision, Propina, DescuentoConsumo, CorteComision, EstadoCorte, TasaComision, DetalleComision } from '../../core/models/commission.model';
import { ApiResponse, PageResponse } from '../../core/models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CommissionService {
  private readonly url = `${environment.apiUrl}/commissions`;

  constructor(private http: HttpClient) {}

  getResumen(barberoId: number, desde?: string, hasta?: string): Observable<ResumenComision> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http
      .get<ApiResponse<ResumenComision>>(`${this.url}/summary/${barberoId}`, { params })
      .pipe(map(r => r.data!));
  }

  getResumenDetalle(barberoId: number, desde?: string, hasta?: string): Observable<DetalleComision[]> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http
      .get<ApiResponse<DetalleComision[]>>(`${this.url}/summary/${barberoId}/items`, { params })
      .pipe(map(r => r.data ?? []));
  }

  registrarPropina(data: { barberoId: number; monto: number; fecha?: string; notas?: string }): Observable<Propina> {
    return this.http
      .post<ApiResponse<Propina>>(`${this.url}/tips`, data)
      .pipe(map(r => r.data!));
  }

  eliminarPropina(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.url}/tips/${id}`).pipe(map(() => undefined));
  }

  getPropinas(barberoId: number, page = 0, size = 20): Observable<Propina[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<Propina>>>(`${this.url}/tips/${barberoId}`, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  registrarConsumo(data: { barberoId: number; productoId: number; cantidad: number; motivo?: string }): Observable<DescuentoConsumo> {
    return this.http
      .post<ApiResponse<DescuentoConsumo>>(`${this.url}/consumption`, data)
      .pipe(map(r => r.data!));
  }

  eliminarDescuento(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.url}/consumption/${id}`).pipe(map(() => undefined));
  }

  getDescuentos(barberoId: number, page = 0, size = 20): Observable<DescuentoConsumo[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<DescuentoConsumo>>>(`${this.url}/consumption/${barberoId}`, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  generarCorte(data: { barberoId: number; fechaDesde: string; fechaHasta: string; notas?: string }): Observable<CorteComision> {
    return this.http
      .post<ApiResponse<CorteComision>>(`${this.url}/cuts`, data)
      .pipe(map(r => r.data!));
  }

  marcarComoPagado(id: number): Observable<CorteComision> {
    return this.http
      .patch<ApiResponse<CorteComision>>(`${this.url}/cuts/${id}/pay`, {})
      .pipe(map(r => r.data!));
  }

  getCortes(barberoId: number, estado?: EstadoCorte, page = 0, size = 20): Observable<CorteComision[]> {
    let params = new HttpParams().set('barberoId', barberoId).set('page', page).set('size', size);
    if (estado) params = params.set('estado', estado);
    return this.http
      .get<ApiResponse<PageResponse<CorteComision>>>(`${this.url}/cuts`, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  // Tasas de comision por item del catalogo -- no por barbero.
  getTasasServicios(): Observable<TasaComision[]> {
    return this.http.get<ApiResponse<TasaComision[]>>(`${this.url}/rates/services`).pipe(map(r => r.data ?? []));
  }

  actualizarTasaServicio(id: number, porcentajeComision: number): Observable<TasaComision> {
    return this.http.patch<ApiResponse<TasaComision>>(`${this.url}/rates/services/${id}`, { porcentajeComision }).pipe(map(r => r.data!));
  }

  getTasasProductos(): Observable<TasaComision[]> {
    return this.http.get<ApiResponse<TasaComision[]>>(`${this.url}/rates/products`).pipe(map(r => r.data ?? []));
  }

  actualizarTasaProducto(id: number, porcentajeComision: number): Observable<TasaComision> {
    return this.http.patch<ApiResponse<TasaComision>>(`${this.url}/rates/products/${id}`, { porcentajeComision }).pipe(map(r => r.data!));
  }

  getTasasPaquetes(): Observable<TasaComision[]> {
    return this.http.get<ApiResponse<TasaComision[]>>(`${this.url}/rates/packages`).pipe(map(r => r.data ?? []));
  }

  actualizarTasaPaquete(id: number, porcentajeComision: number): Observable<TasaComision> {
    return this.http.patch<ApiResponse<TasaComision>>(`${this.url}/rates/packages/${id}`, { porcentajeComision }).pipe(map(r => r.data!));
  }
}
