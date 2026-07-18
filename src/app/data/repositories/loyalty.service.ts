import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoyaltyAccount, LoyaltyMovement, LoyaltyConfig, Reward } from '../../core/models/loyalty.model';
import { ApiResponse, PageResponse } from '../../core/models/api-response.model';
import { environment } from '../../../environments/environment';

export interface SelloResponse {
  sellosActuales: number;
  sellosNecesarios: number;
  recompensasDisponibles: number;
  nuevaRecompensaObtenida: boolean;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class LoyaltyService {
  private readonly url = `${environment.apiUrl}/loyalty`;
  private readonly configUrl = `${environment.apiUrl}/loyalty/config`;

  constructor(private http: HttpClient) {}

  getAccounts(page = 0, size = 50): Observable<LoyaltyAccount[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<LoyaltyAccount>>>(`${this.url}/customers`, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  getByCustomer(clienteId: number): Observable<LoyaltyAccount> {
    return this.http
      .get<ApiResponse<LoyaltyAccount>>(`${this.url}/customers/${clienteId}`)
      .pipe(map(r => r.data!));
  }

  getMovementsByCustomer(clienteId: number, page = 0, size = 50): Observable<LoyaltyMovement[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<LoyaltyMovement>>>(`${this.url}/customers/${clienteId}/history`, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  getCustomersWithRewards(page = 0, size = 50): Observable<LoyaltyAccount[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<LoyaltyAccount>>>(`${this.url}/customers-with-rewards`, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  addStamp(clienteId: number, ventaId?: number, motivo?: string): Observable<SelloResponse> {
    return this.http
      .post<ApiResponse<SelloResponse>>(`${this.url}/customers/${clienteId}/add-stamp`, {
        ventaId: ventaId ?? null,
        motivo: motivo ?? 'Servicio atendido',
      })
      .pipe(map(r => r.data!));
  }

  redeemReward(clienteId: number, motivo = 'Canje de recompensa'): Observable<SelloResponse> {
    return this.http
      .post<ApiResponse<SelloResponse>>(`${this.url}/customers/${clienteId}/redeem`, { motivo })
      .pipe(map(r => r.data!));
  }

  updateRewardDescription(clienteId: number, descripcion: string): Observable<LoyaltyAccount> {
    return this.http
      .patch<ApiResponse<LoyaltyAccount>>(`${this.url}/customers/${clienteId}/reward-description`, { descripcion })
      .pipe(map(r => r.data!));
  }

  getConfig(): Observable<LoyaltyConfig> {
    return this.http
      .get<ApiResponse<LoyaltyConfig>>(this.configUrl)
      .pipe(map(r => r.data!));
  }

  updateConfig(config: Partial<LoyaltyConfig>): Observable<LoyaltyConfig> {
    return this.http
      .put<ApiResponse<LoyaltyConfig>>(this.configUrl, config)
      .pipe(map(r => r.data!));
  }

  getRewards(): Observable<Reward[]> {
    return this.http
      .get<ApiResponse<Reward[]>>(`${this.url}/rewards`)
      .pipe(map(r => r.data ?? []));
  }
}
