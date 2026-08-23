import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../../core/models/api-response.model';
import { WhatsAppConfig, WhatsAppConfigRequest } from '../../core/models/whatsapp-config.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WhatsAppConfigService {
  private readonly url = `${environment.apiUrl}/config/whatsapp`;

  constructor(private http: HttpClient) {}

  obtener(): Observable<WhatsAppConfig> {
    return this.http.get<ApiResponse<WhatsAppConfig>>(this.url).pipe(map(r => r.data!));
  }

  actualizar(data: WhatsAppConfigRequest): Observable<WhatsAppConfig> {
    return this.http.put<ApiResponse<WhatsAppConfig>>(this.url, data).pipe(map(r => r.data!));
  }
}
