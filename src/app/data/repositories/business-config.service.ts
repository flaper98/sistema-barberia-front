import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiResponse } from '../../core/models/api-response.model';
import { BusinessConfig, DEFAULT_BUSINESS_CONFIG } from '../../core/models/business-config.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BusinessConfigService {
  private readonly url = `${environment.apiUrl}/config/barbershop`;

  constructor(private http: HttpClient) {}

  /** Si todavía no hay configuración guardada en el backend, usa un valor por defecto en vez de fallar. */
  obtener(): Observable<BusinessConfig> {
    return this.http.get<ApiResponse<BusinessConfig>>(this.url).pipe(
      map(r => r.data ?? DEFAULT_BUSINESS_CONFIG),
      catchError(() => of(DEFAULT_BUSINESS_CONFIG)),
    );
  }

  actualizar(data: BusinessConfig): Observable<BusinessConfig> {
    return this.http
      .put<ApiResponse<BusinessConfig>>(this.url, data)
      .pipe(map(r => r.data!));
  }
}
