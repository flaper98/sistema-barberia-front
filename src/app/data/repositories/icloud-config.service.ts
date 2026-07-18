import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../../core/models/api-response.model';
import { IcloudConfig, IcloudConfigRequest } from '../../core/models/icloud-config.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class IcloudConfigService {
  private readonly url = `${environment.apiUrl}/config/icloud`;

  constructor(private http: HttpClient) {}

  obtener(): Observable<IcloudConfig> {
    return this.http.get<ApiResponse<IcloudConfig>>(this.url).pipe(map(r => r.data!));
  }

  actualizar(data: IcloudConfigRequest): Observable<IcloudConfig> {
    return this.http.put<ApiResponse<IcloudConfig>>(this.url, data).pipe(map(r => r.data!));
  }
}
