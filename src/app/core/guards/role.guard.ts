import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { PermissionService } from '../auth/permission.service';
import { User } from '../models/user.model';
import { Modulo } from '../models/permission.model';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // ADMIN siempre tiene acceso total, sin importar la matriz de permisos.
    if (this.authService.hasRole(['ADMIN'])) return true;

    const modulo: Modulo | undefined = route.data['modulo'];
    if (modulo) {
      const permitido = route.data['requiereEdicion']
        ? this.permissionService.canEdit(modulo)
        : this.permissionService.canView(modulo);
      if (permitido) return true;
      this.router.navigate(['/dashboard']);
      return false;
    }

    const requiredRoles: User['rol'][] = route.data['roles'] ?? [];
    if (!requiredRoles.length || this.authService.hasRole(requiredRoles)) return true;
    this.router.navigate(['/dashboard']);
    return false;
  }
}
