import { Component } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { User } from '../../core/models/user.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
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
  navItems: NavItem[] = [
    { label: 'Dashboard',    icon: 'dashboard',          route: '/dashboard' },
    { label: 'Ventas',       icon: 'point_of_sale',       route: '/sales/quick' },
    { label: 'Citas',        icon: 'calendar_today',      route: '/appointments' },
    { label: 'Clientes',     icon: 'people',              route: '/customers' },
    { label: 'Barberos',     icon: 'content_cut',         route: '/workers',      roles: ['ADMIN', 'RECEPTION'] },
    { label: 'Servicios',    icon: 'spa',                 route: '/services',     roles: ['ADMIN'] },
    { label: 'Productos',    icon: 'inventory_2',         route: '/products' },
    { label: 'Inventario',   icon: 'warehouse',           route: '/inventory',    roles: ['ADMIN', 'CASHIER'] },
    { label: 'Fidelización', icon: 'loyalty',             route: '/loyalty' },
    { label: 'Finanzas',     icon: 'account_balance_wallet', route: '/finance',  roles: ['ADMIN', 'CASHIER'] },
    { label: 'Reportes',     icon: 'bar_chart',           route: '/reports',      roles: ['ADMIN'] },
    { label: 'Configuración',icon: 'settings',            route: '/settings',     roles: ['ADMIN'] },
  ];

  constructor(public authService: AuthService) {}

  get currentUser(): User | null {
    return this.authService.currentUser;
  }

  isVisible(item: NavItem): boolean {
    if (!item.roles) return true;
    return this.authService.hasRole(item.roles);
  }

  logout(): void {
    this.authService.logout();
  }
}
