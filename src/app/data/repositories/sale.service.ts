import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Sale, SaleFilters, QuickSaleForm, PaymentMethod } from '../../core/models/sale.model';
import { ApiResponse, PageResponse } from '../../core/models/api-response.model';
import { environment } from '../../../environments/environment';
import { toLocalDateStr } from '../../core/utils/date.util';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly url = `${environment.apiUrl}/sales`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 50): Observable<Sale[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<Sale>>>(this.url, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  getById(id: number): Observable<Sale> {
    return this.http
      .get<ApiResponse<Sale>>(`${this.url}/${id}`)
      .pipe(map(r => r.data!));
  }

  search(filters: SaleFilters): Observable<Sale[]> {
    let params = new HttpParams().set('page', 0).set('size', 100);
    // El backend (VentaController.listar) espera los parametros "desde"/
    // "hasta", no "fechaDesde"/"fechaHasta" -- con el nombre equivocado el
    // filtro de fecha quedaba silenciosamente sin efecto (@RequestParam
    // ignora los que no matchean, no tira error).
    if (filters.fechaDesde) params = params.set('desde', filters.fechaDesde);
    if (filters.fechaHasta) params = params.set('hasta', filters.fechaHasta);
    if (filters.barberoId) params = params.set('barberoId', filters.barberoId);
    if (filters.tipoVenta) params = params.set('tipoVenta', filters.tipoVenta);
    if (filters.estado) params = params.set('estado', filters.estado);
    return this.http
      .get<ApiResponse<PageResponse<Sale>>>(this.url, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  getTodaySales(): Observable<Sale[]> {
    const today = toLocalDateStr(new Date());
    return this.search({ fechaDesde: today, fechaHasta: today });
  }

  getByWorker(barberoId: number, page = 0, size = 50): Observable<Sale[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<Sale>>>(`${this.url}/by-worker/${barberoId}`, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  getByCustomer(clienteId: number, page = 0, size = 50): Observable<Sale[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<Sale>>>(`${this.url}/by-customer/${clienteId}`, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  /**
   * El backend recalcula subtotal, tipo de venta y descuenta stock.
   * El frontend NO debe calcular totales definitivos.
   */
  create(form: QuickSaleForm): Observable<Sale> {
    const body = {
      clienteId: form.clienteId ?? null,
      barberoId: form.barberoId,
      metodoPago: form.metodoPago,
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
      .post<ApiResponse<Sale>>(`${this.url}/quick-sale`, body)
      .pipe(map(r => r.data!));
  }

  cancel(id: number): Observable<Sale> {
    return this.http
      .patch<ApiResponse<Sale>>(`${this.url}/${id}/cancel`, {})
      .pipe(map(r => r.data!));
  }

  confirm(id: number, metodoPago?: PaymentMethod): Observable<Sale> {
    return this.http
      .patch<ApiResponse<Sale>>(`${this.url}/${id}/confirm`, metodoPago ? { metodoPago } : {})
      .pipe(map(r => r.data!));
  }

  /** Solo ADMIN (validado tambien en el backend). No permite editar los items. */
  update(id: number, data: { clienteId: number; barberoId: number; metodoPago: PaymentMethod; descuento: number; notas?: string }): Observable<Sale> {
    return this.http
      .put<ApiResponse<Sale>>(`${this.url}/${id}`, data)
      .pipe(map(r => r.data!));
  }

  getReports(): Observable<{ totalVentas: number; totalIngresos: number; ventasPorBarbero: { nombre: string; total: number; cantidad: number }[] }> {
    return this.getTodaySales().pipe(
      map(sales => {
        const completadas = sales.filter(s => s.estado === 'COMPLETADA');
        const totalIngresos = completadas.reduce((acc, s) => acc + s.total, 0);
        const byWorker = new Map<string, { total: number; cantidad: number }>();
        completadas.forEach(s => {
          const entry = byWorker.get(s.barberoNombre) ?? { total: 0, cantidad: 0 };
          entry.total += s.total;
          entry.cantidad += 1;
          byWorker.set(s.barberoNombre, entry);
        });
        return {
          totalVentas: completadas.length,
          totalIngresos,
          ventasPorBarbero: Array.from(byWorker.entries()).map(([nombre, d]) => ({ nombre, ...d })),
        };
      }),
    );
  }
}
