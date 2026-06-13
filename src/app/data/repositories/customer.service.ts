import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Customer, CustomerFilters } from '../../core/models/customer.model';
import { ApiResponse, PageResponse } from '../../core/models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly url = `${environment.apiUrl}/customers`;
  private readonly loyaltyUrl = `${environment.apiUrl}/loyalty`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 100): Observable<Customer[]> {
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

  search(filters: CustomerFilters): Observable<Customer[]> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.page !== undefined) params = params.set('page', filters.page);
    if (filters.size !== undefined) params = params.set('size', filters.size);
    return this.http
      .get<ApiResponse<PageResponse<Customer>>>(this.url, { params })
      .pipe(map(r => r.data?.content ?? []));
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
