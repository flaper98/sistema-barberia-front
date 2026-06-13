import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, map, catchError, switchMap } from 'rxjs/operators';
import {
  AuthCredentials,
  AuthMeResponse,
  AuthState,
  LoginApiResponse,
  User,
  UserRole,
} from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';
import { TokenService } from './token.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private authState = new BehaviorSubject<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  });

  authState$ = this.authState.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private tokenService: TokenService,
  ) {
    this.restoreSession();
  }

  get currentUser(): User | null {
    return this.authState.getValue().user;
  }

  get isAuthenticated(): boolean {
    return this.authState.getValue().isAuthenticated;
  }

  get token(): string | null {
    return this.tokenService.getAccessToken();
  }

  login(credentials: AuthCredentials): Observable<User> {
    return this.http
      .post<ApiResponse<LoginApiResponse>>(`${this.baseUrl}/login`, credentials)
      .pipe(
        map(res => {
          if (!res.success || !res.data) throw new Error(res.error ?? 'Error de autenticación');
          return res.data;
        }),
        tap(data => this.tokenService.setTokens(data.accessToken, data.refreshToken)),
        switchMap(() => this.loadCurrentUser()),
        catchError(err => {
          const msg = err?.error?.error ?? err?.message ?? 'Credenciales incorrectas';
          return throwError(() => new Error(msg));
        }),
      );
  }

  refreshToken(): Observable<string> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) return throwError(() => new Error('No hay refresh token'));

    return this.http
      .post<ApiResponse<LoginApiResponse>>(`${this.baseUrl}/refresh-token`, { refreshToken })
      .pipe(
        map(res => {
          if (!res.success || !res.data) throw new Error('No se pudo renovar la sesión');
          return res.data;
        }),
        tap(data => this.tokenService.setTokens(data.accessToken, data.refreshToken)),
        map(data => data.accessToken),
        catchError(err => {
          this.clearSession();
          return throwError(() => err);
        }),
      );
  }

  loadCurrentUser(): Observable<User> {
    return this.http
      .get<ApiResponse<AuthMeResponse>>(`${this.baseUrl}/me`)
      .pipe(
        map(res => {
          if (!res.success || !res.data) throw new Error('No se pudo cargar el usuario');
          const me = res.data;
          const user: User = {
            id: me.id,
            nombre: me.nombre,
            apellido: me.apellido,
            email: me.email,
            rol: me.rol as UserRole,
            estado: me.estado,
            avatar: me.avatar,
            createdAt: me.createdAt,
          };
          localStorage.setItem(environment.userKey, JSON.stringify(user));
          this.authState.next({ user, token: this.tokenService.getAccessToken(), isAuthenticated: true });
          return user;
        }),
      );
  }

  logout(): void {
    const token = this.tokenService.getAccessToken();
    if (token) {
      this.http.post(`${this.baseUrl}/logout`, {}).subscribe({ error: () => {} });
    }
    this.clearSession();
  }

  hasRole(roles: UserRole[]): boolean {
    const user = this.currentUser;
    return !!user && roles.includes(user.rol);
  }

  private clearSession(): void {
    this.tokenService.clearTokens();
    this.authState.next({ user: null, token: null, isAuthenticated: false });
    this.router.navigate(['/login']);
  }

  private restoreSession(): void {
    const token = this.tokenService.getAccessToken();
    const userJson = localStorage.getItem(environment.userKey);
    if (token && userJson) {
      try {
        const user: User = JSON.parse(userJson);
        this.authState.next({ user, token, isAuthenticated: true });
        // Refresca el perfil en segundo plano para mantenerlo actualizado
        if (!this.tokenService.isAccessTokenExpired()) {
          this.loadCurrentUser().subscribe({ error: () => this.clearSession() });
        } else {
          this.refreshToken().subscribe({
            next: () => this.loadCurrentUser().subscribe({ error: () => this.clearSession() }),
            error: () => this.clearSession(),
          });
        }
      } catch {
        this.clearSession();
      }
    }
  }
}
