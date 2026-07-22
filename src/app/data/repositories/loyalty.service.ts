import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoyaltyAccount, LoyaltyMovement, LoyaltyConfig, Reward, ReglaFidelizacion } from '../../core/models/loyalty.model';
import { ApiResponse, PageResponse } from '../../core/models/api-response.model';
import { environment } from '../../../environments/environment';

const EMPTY_PAGE: PageResponse<LoyaltyAccount> = { content: [], page: 0, size: 0, totalElements: 0, totalPages: 0, first: true, last: true };

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
    return this.getAccountsPaged({ page, size }).pipe(map(r => r.content));
  }

  /**
   * Version paginada, con busqueda resuelta del lado del servidor -- con
   * 1000+ clientes, la version anterior (una sola pagina de 50, ordenada
   * alfabeticamente, sin buscar en el servidor) hacia que un cliente recien
   * creado pareciera "no estar" en Fidelizacion.
   */
  getAccountsPaged(opts: { search?: string; page?: number; size?: number }): Observable<PageResponse<LoyaltyAccount>> {
    let params = new HttpParams().set('page', opts.page ?? 0).set('size', opts.size ?? 50);
    if (opts.search) params = params.set('search', opts.search);
    return this.http
      .get<ApiResponse<PageResponse<LoyaltyAccount>>>(`${this.url}/customers`, { params })
      .pipe(map(r => r.data ?? EMPTY_PAGE));
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
    return this.getCustomersWithRewardsPaged({ page, size }).pipe(map(r => r.content));
  }

  getCustomersWithRewardsPaged(opts: { page?: number; size?: number }): Observable<PageResponse<LoyaltyAccount>> {
    const params = new HttpParams().set('page', opts.page ?? 0).set('size', opts.size ?? 50);
    return this.http
      .get<ApiResponse<PageResponse<LoyaltyAccount>>>(`${this.url}/customers-with-rewards`, { params })
      .pipe(map(r => r.data ?? EMPTY_PAGE));
  }

  addStamp(clienteId: number, ventaId?: number, motivo?: string): Observable<SelloResponse> {
    return this.http
      .post<ApiResponse<SelloResponse>>(`${this.url}/customers/${clienteId}/add-stamp`, {
        ventaId: ventaId ?? null,
        motivo: motivo ?? 'Servicio atendido',
      })
      .pipe(map(r => r.data!));
  }

  /** Para corregir un sello agregado por error -- quita de a uno. */
  removeStamp(clienteId: number, motivo = 'Corrección manual'): Observable<SelloResponse> {
    return this.http
      .post<ApiResponse<SelloResponse>>(`${this.url}/customers/${clienteId}/remove-stamp`, { motivo })
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

  // Reglas de fidelizacion por item del catalogo -- no por cliente.
  getReglasServicios(): Observable<ReglaFidelizacion[]> {
    return this.http.get<ApiResponse<ReglaFidelizacion[]>>(`${this.url}/rules/services`).pipe(map(r => r.data ?? []));
  }

  actualizarReglaServicio(id: number, aplicaFidelizacion: boolean): Observable<ReglaFidelizacion> {
    return this.http.patch<ApiResponse<ReglaFidelizacion>>(`${this.url}/rules/services/${id}`, { aplicaFidelizacion }).pipe(map(r => r.data!));
  }

  getReglasProductos(): Observable<ReglaFidelizacion[]> {
    return this.http.get<ApiResponse<ReglaFidelizacion[]>>(`${this.url}/rules/products`).pipe(map(r => r.data ?? []));
  }

  actualizarReglaProducto(id: number, aplicaFidelizacion: boolean): Observable<ReglaFidelizacion> {
    return this.http.patch<ApiResponse<ReglaFidelizacion>>(`${this.url}/rules/products/${id}`, { aplicaFidelizacion }).pipe(map(r => r.data!));
  }

  getReglasPaquetes(): Observable<ReglaFidelizacion[]> {
    return this.http.get<ApiResponse<ReglaFidelizacion[]>>(`${this.url}/rules/packages`).pipe(map(r => r.data ?? []));
  }

  actualizarReglaPaquete(id: number, aplicaFidelizacion: boolean): Observable<ReglaFidelizacion> {
    return this.http.patch<ApiResponse<ReglaFidelizacion>>(`${this.url}/rules/packages/${id}`, { aplicaFidelizacion }).pipe(map(r => r.data!));
  }
}
