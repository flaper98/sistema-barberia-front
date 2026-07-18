import { Component, EventEmitter, Output } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { PermissionService } from '../../core/auth/permission.service';
import { User } from '../../core/models/user.model';
import { Modulo } from '../../core/models/permission.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  modulo?: Modulo;
  roles?: User['rol'][];
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @Output() itemClick = new EventEmitter<void>();

  navItems: NavItem[] = [
    { label: 'Dashboard',    icon: 'dashboard',          route: '/dashboard',   modulo: 'DASHBOARD' },
    { label: 'Ventas',       icon: 'point_of_sale',       route: '/sales/list',  modulo: 'VENTAS' },
    { label: 'Citas',        icon: 'calendar_today',      route: '/appointments', modulo: 'CITAS' },
    { label: 'Clientes',     icon: 'people',              route: '/customers',   modulo: 'CLIENTES' },
    { label: 'Barberos',     icon: 'content_cut',         route: '/workers',     modulo: 'BARBEROS' },
    { label: 'Servicios',    icon: 'spa',                 route: '/services',    modulo: 'SERVICIOS' },
    { label: 'Productos',    icon: 'inventory_2',         route: '/products',    modulo: 'PRODUCTOS' },
    { label: 'Inventario',   icon: 'warehouse',           route: '/inventory',   modulo: 'INVENTARIO' },
    { label: 'Fidelización', icon: 'loyalty',             route: '/loyalty',     modulo: 'FIDELIZACION' },
    { label: 'Finanzas',     icon: 'account_balance_wallet', route: '/finance',  modulo: 'FINANZAS' },
    { label: 'Reportes',     icon: 'bar_chart',           route: '/reports',     modulo: 'REPORTES' },
    { label: 'Usuarios',     icon: 'admin_panel_settings', route: '/users',      roles: ['ADMIN'] },
    { label: 'Configuración',icon: 'settings',            route: '/settings',    modulo: 'CONFIGURACION' },
  ];

  constructor(public authService: AuthService, private permissionService: PermissionService) {}

  get currentUser(): User | null {
    return this.authService.currentUser;
  }

  isVisible(item: NavItem): boolean {
    if (this.authService.hasRole(['ADMIN'])) return true;
    if (item.modulo) return this.permissionService.canView(item.modulo);
    if (item.roles) return this.authService.hasRole(item.roles);
    return true;
  }

  // "Ventas" apunta al historial (igual que el resto de los modulos: lista
  // primero, con boton para crear), pero el backend no deja que BARBER lea
  // GET /api/sales (evita que un barbero vea las ventas/comisiones de sus
  // companeros) -- para ese rol el link tiene que seguir yendo a Venta
  // Rapida, la unica vista de ventas que si puede usar.
  getRoute(item: NavItem): string {
    if (item.route === '/sales/list' && this.authService.hasRole(['BARBER'])) {
      return '/sales/quick';
    }
    return item.route;
  }

  logout(): void {
    this.authService.logout();
  }
}
