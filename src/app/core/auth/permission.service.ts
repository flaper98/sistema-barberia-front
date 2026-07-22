import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import { MatrizPermisos, Modulo, PermisoPorModulo, RolPermisoItem } from '../models/permission.model';
import { environment } from '../../../environments/environment';

const STORAGE_KEY = 'barber_permisos';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly url = `${environment.apiUrl}/role-permissions`;
  private permisos: PermisoPorModulo = this.leerCache();

  constructor(private http: HttpClient) {}

  cargarMisPermisos(): Observable<PermisoPorModulo> {
    return this.http.get<ApiResponse<PermisoPorModulo>>(`${this.url}/me`).pipe(
      map(r => r.data ?? {}),
      tap(data => {
        this.permisos = data;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }),
    );
  }

  canView(modulo: Modulo): boolean {
    return this.permisos[modulo]?.puedeVer ?? false;
  }

  canEdit(modulo: Modulo): boolean {
    return this.permisos[modulo]?.puedeEditar ?? false;
  }

  canDelete(modulo: Modulo): boolean {
    return this.permisos[modulo]?.puedeEliminar ?? false;
  }

  // Solo tiene sentido para 'COMISIONES' -- ver el detalle por item de
  // ventas/comisiones de un barbero, con fecha.
  canViewDetail(modulo: Modulo): boolean {
    return this.permisos[modulo]?.puedeVerDetalle ?? false;
  }

  clear(): void {
    this.permisos = {};
    localStorage.removeItem(STORAGE_KEY);
  }

  obtenerMatriz(): Observable<MatrizPermisos> {
    return this.http
      .get<ApiResponse<MatrizPermisos>>(this.url)
      .pipe(map(r => r.data ?? ({} as MatrizPermisos)));
  }

  actualizarMatriz(items: RolPermisoItem[]): Observable<void> {
    return this.http.put<ApiResponse<void>>(this.url, items).pipe(map(() => undefined));
  }

  private leerCache(): PermisoPorModulo {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
}
