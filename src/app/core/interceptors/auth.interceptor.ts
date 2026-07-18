import { Injectable, Injector } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { TokenService } from '../auth/token.service';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

const PUBLIC_ENDPOINTS = [
  `${environment.apiUrl}/auth/login`,
  `${environment.apiUrl}/auth/refresh-token`,
  `${environment.apiUrl}/public/`,
];

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshDone$ = new BehaviorSubject<string | null>(null);

  constructor(
    private tokenService: TokenService,
    private injector: Injector,
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (PUBLIC_ENDPOINTS.some(url => req.url.includes(url))) {
      return next.handle(req);
    }

    const cloned = this.addToken(req, this.tokenService.getAccessToken());

    return next.handle(cloned).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !req.url.includes('/auth/')) {
          return this.handle401(req, next);
        }
        return throwError(() => this.toUserMessage(err));
      }),
    );
  }

  private addToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
    if (!token) return req;
    return req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) });
  }

  private handle401(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isRefreshing) {
      return this.refreshDone$.pipe(
        filter(t => t !== null),
        take(1),
        switchMap(token => next.handle(this.addToken(req, token))),
      );
    }

    this.isRefreshing = true;
    this.refreshDone$.next(null);

    const authService = this.injector.get(AuthService);

    return authService.refreshToken().pipe(
      switchMap((newToken: string) => {
        this.isRefreshing = false;
        this.refreshDone$.next(newToken);
        return next.handle(this.addToken(req, newToken));
      }),
      catchError(err => {
        this.isRefreshing = false;
        authService.logout();
        return throwError(() => err);
      }),
    );
  }

  private toUserMessage(err: HttpErrorResponse): Error {
    const body = err.error;

    // Errores de validación (MethodArgumentNotValidException): el detalle útil
    // vive en fieldErrors[], el "message" de arriba es solo un genérico.
    if (Array.isArray(body?.fieldErrors) && body.fieldErrors.length) {
      const detalle = body.fieldErrors
        .map((fe: { message?: string }) => fe.message)
        .filter(Boolean)
        .join(' ');
      if (detalle) return new Error(detalle);
    }

    // ErrorResponse (GlobalExceptionHandler): "message" es el texto específico,
    // "error" es solo la categoría (p.ej. "Conflicto", "Error de negocio").
    if (body?.message) return new Error(body.message);

    // ApiResponse.error(...): el texto específico viaja en "error".
    if (body?.error) return new Error(body.error);

    const messages: Record<number, string> = {
      400: 'Datos de solicitud inválidos.',
      401: 'La sesión ha expirado. Por favor, vuelve a iniciar sesión.',
      403: 'No tienes permisos para realizar esta acción.',
      404: 'El recurso solicitado no fue encontrado.',
      409: 'Ya existe un registro con esos datos.',
      500: 'Ocurrió un error inesperado en el servidor.',
    };

    return new Error(messages[err.status] ?? `Error ${err.status}: ${err.statusText}`);
  }
}
