import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../../core/models/api-response.model';
import { Paquete } from '../../core/models/paquete.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaqueteService {
  private readonly url = `${environment.apiUrl}/packages`;

  constructor(private http: HttpClient) {}

  getActivos(): Observable<Paquete[]> {
    return this.http.get<ApiResponse<Paquete[]>>(this.url).pipe(map(r => r.data ?? []));
  }

  getTodos(): Observable<Paquete[]> {
    return this.http.get<ApiResponse<Paquete[]>>(`${this.url}/all`).pipe(map(r => r.data ?? []));
  }

  crear(data: Omit<Paquete, 'id' | 'estado'>): Observable<Paquete> {
    return this.http.post<ApiResponse<Paquete>>(this.url, data).pipe(map(r => r.data!));
  }

  actualizar(id: number, data: Omit<Paquete, 'id' | 'estado'>): Observable<Paquete> {
    return this.http.put<ApiResponse<Paquete>>(`${this.url}/${id}`, data).pipe(map(r => r.data!));
  }

  toggleStatus(id: number, estado: boolean): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.url}/${id}/status`, { estado })
      .pipe(map(() => undefined));
  }
}
