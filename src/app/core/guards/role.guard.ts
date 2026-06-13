import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRoles: User['rol'][] = route.data['roles'] ?? [];
    if (!requiredRoles.length || this.authService.hasRole(requiredRoles)) return true;
    this.router.navigate(['/dashboard']);
    return false;
  }
}
