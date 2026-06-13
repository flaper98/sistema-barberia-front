import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product, StockMovement, ProductFilters, StockMovementType } from '../../core/models/product.model';
import { ApiResponse, PageResponse } from '../../core/models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly url = `${environment.apiUrl}/products`;
  private readonly inventoryUrl = `${environment.apiUrl}/inventory`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 100): Observable<Product[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<Product>>>(this.url, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  getLowStock(): Observable<Product[]> {
    return this.http
      .get<ApiResponse<PageResponse<Product>>>(`${this.url}/low-stock`)
      .pipe(map(r => r.data?.content ?? []));
  }

  getById(id: number): Observable<Product> {
    return this.http
      .get<ApiResponse<Product>>(`${this.url}/${id}`)
      .pipe(map(r => r.data!));
  }

  search(filters: ProductFilters): Observable<Product[]> {
    let params = new HttpParams().set('page', 0).set('size', 100);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.categoria) params = params.set('categoria', filters.categoria);
    return this.http
      .get<ApiResponse<PageResponse<Product>>>(this.url, { params })
      .pipe(map(r => {
        let result = r.data?.content ?? [];
        if (filters.lowStock) result = result.filter(p => p.stockActual <= p.stockMinimo);
        if (filters.estado !== undefined) result = result.filter(p => p.estado === filters.estado);
        return result;
      }));
  }

  create(data: Omit<Product, 'id'>): Observable<Product> {
    return this.http
      .post<ApiResponse<Product>>(this.url, data)
      .pipe(map(r => r.data!));
  }

  update(id: number, data: Partial<Product>): Observable<Product> {
    return this.http
      .put<ApiResponse<Product>>(`${this.url}/${id}`, data)
      .pipe(map(r => r.data!));
  }

  toggleStatus(id: number): Observable<Product> {
    return this.http
      .patch<ApiResponse<Product>>(`${this.url}/${id}/status`, {})
      .pipe(map(r => r.data!));
  }

  delete(id: number): Observable<void> {
    return this.toggleStatus(id).pipe(map(() => undefined));
  }

  getMovements(page = 0, size = 100): Observable<StockMovement[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<StockMovement>>>(`${this.inventoryUrl}/movements`, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  registerMovement(
    productoId: number,
    tipo: StockMovementType,
    cantidad: number,
    motivo: string,
    _usuarioId: number,
    _usuarioNombre: string,
  ): Observable<StockMovement> {
    return this.http
      .post<ApiResponse<StockMovement>>(`${this.inventoryUrl}/movements`, {
        productoId,
        tipoMovimiento: tipo,
        cantidad,
        motivo,
      })
      .pipe(map(r => r.data!));
  }
}
