import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Customer, CustomerFilters, CustomerSelector } from '../../core/models/customer.model';
import { ApiResponse, PageResponse } from '../../core/models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly url = `${environment.apiUrl}/customers`;
  private readonly loyaltyUrl = `${environment.apiUrl}/loyalty`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 2000): Observable<Customer[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<Customer>>>(this.url, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  getById(id: number): Observable<Customer> {
    return this.http
      .get<ApiResponse<Customer>>(`${this.url}/${id}`)
      .pipe(map(r => r.data!));
  }

  /** Solo informativo, para mostrar en el formulario de alta antes de guardar. */
  getNextCode(): Observable<number | null> {
    return this.http
      .get<ApiResponse<number>>(`${this.url}/next-code`)
      .pipe(map(r => r.data ?? null));
  }

  search(filters: CustomerFilters): Observable<Customer[]> {
    return this.searchPaged(filters).pipe(map(r => r.content));
  }

  /**
   * Para selectores (ej. el barbero adjuntando un cliente a su solicitud de
   * venta): no depende del permiso del módulo Clientes -- ver
   * ClienteController#listarParaSelector, mismo criterio que
   * WorkerService.getForSale().
   */
  searchForSale(search?: string): Observable<CustomerSelector[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http
      .get<ApiResponse<CustomerSelector[]>>(`${this.url}/for-sale`, { params })
      .pipe(map(r => r.data ?? []));
  }

  /**
   * Busqueda paginada del lado del servidor (filtros de texto/sellos/
   * recompensa/inactividad se resuelven en la base, no trayendo todo al
   * frontend). Devuelve la pagina completa (con totalElements) para poder
   * manejar el paginador de Material sin cargar de mas.
   */
  searchPaged(filters: CustomerFilters): Observable<PageResponse<Customer>> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.sellosMin != null) params = params.set('sellosMin', filters.sellosMin);
    if (filters.recompensa) params = params.set('recompensa', filters.recompensa);
    if (filters.inactividad) params = params.set('inactividad', filters.inactividad);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortDir) params = params.set('sortDir', filters.sortDir);
    if (filters.page !== undefined) params = params.set('page', filters.page);
    if (filters.size !== undefined) params = params.set('size', filters.size);
    return this.http
      .get<ApiResponse<PageResponse<Customer>>>(this.url, { params })
      .pipe(map(r => r.data ?? { content: [], page: 0, size: 0, totalElements: 0, totalPages: 0, first: true, last: true }));
  }

  create(data: Omit<Customer, 'id' | 'createdAt' | 'cantidadSellos' | 'recompensasDisponibles'>): Observable<Customer> {
    return this.http
      .post<ApiResponse<Customer>>(this.url, data)
      .pipe(map(r => r.data!));
  }

  update(id: number, data: Partial<Customer>): Observable<Customer> {
    return this.http
      .put<ApiResponse<Customer>>(`${this.url}/${id}`, data)
      .pipe(map(r => r.data!));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.url}/${id}`)
      .pipe(map(() => undefined));
  }

  getWithRewards(page = 0, size = 50): Observable<Customer[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<Customer>>>(`${this.url}/with-rewards`, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  addStamp(clienteId: number): Observable<Customer> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.loyaltyUrl}/customers/${clienteId}/add-stamp`, {
        motivo: 'Servicio atendido',
      })
      .pipe(switchMap(() => this.getById(clienteId)));
  }

  redeemReward(clienteId: number): Observable<Customer> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.loyaltyUrl}/customers/${clienteId}/redeem`, {
        motivo: 'Canje de recompensa',
      })
      .pipe(switchMap(() => this.getById(clienteId)));
  }
}
