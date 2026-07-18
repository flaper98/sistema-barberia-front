import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../../core/models/api-response.model';
import { CategoriaProducto } from '../../core/models/categoria-producto.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoriaProductoService {
  private readonly url = `${environment.apiUrl}/products/categories`;

  constructor(private http: HttpClient) {}

  getActivas(): Observable<CategoriaProducto[]> {
    return this.http.get<ApiResponse<CategoriaProducto[]>>(this.url).pipe(map(r => r.data ?? []));
  }

  getTodas(): Observable<CategoriaProducto[]> {
    return this.http.get<ApiResponse<CategoriaProducto[]>>(`${this.url}/all`).pipe(map(r => r.data ?? []));
  }

  crear(nombre: string): Observable<CategoriaProducto> {
    return this.http.post<ApiResponse<CategoriaProducto>>(this.url, { nombre }).pipe(map(r => r.data!));
  }

  renombrar(id: number, nombre: string): Observable<CategoriaProducto> {
    return this.http.put<ApiResponse<CategoriaProducto>>(`${this.url}/${id}`, { nombre }).pipe(map(r => r.data!));
  }

  toggleStatus(id: number, estado: boolean): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.url}/${id}/status`, { estado })
      .pipe(map(() => undefined));
  }
}
