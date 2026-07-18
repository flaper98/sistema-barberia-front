import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Usuario, UsuarioRequest } from '../../core/models/usuario.model';
import { ApiResponse, PageResponse } from '../../core/models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly url = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(search?: string, page = 0, size = 100): Observable<Usuario[]> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) params = params.set('search', search);
    return this.http
      .get<ApiResponse<PageResponse<Usuario>>>(this.url, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  getById(id: number): Observable<Usuario> {
    return this.http
      .get<ApiResponse<Usuario>>(`${this.url}/${id}`)
      .pipe(map(r => r.data!));
  }

  create(data: UsuarioRequest): Observable<Usuario> {
    return this.http
      .post<ApiResponse<Usuario>>(this.url, data)
      .pipe(map(r => r.data!));
  }

  update(id: number, data: UsuarioRequest): Observable<Usuario> {
    return this.http
      .put<ApiResponse<Usuario>>(`${this.url}/${id}`, data)
      .pipe(map(r => r.data!));
  }

  toggleStatus(id: number, estado: boolean): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.url}/${id}/status`, { estado })
      .pipe(map(() => undefined));
  }

  cambiarMiPassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.url}/me/password`, { currentPassword, newPassword })
      .pipe(map(() => undefined));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.url}/${id}`)
      .pipe(map(() => undefined));
  }
}
