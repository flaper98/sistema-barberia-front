import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  @Output() menuToggle = new EventEmitter<void>();

  constructor(public authService: AuthService, private router: Router) {}

  get currentUser(): User | null {
    return this.authService.currentUser;
  }

  get pageTitle(): string {
    const path = this.router.url.split('/')[1];
    const titles: Record<string, string> = {
      dashboard:    'Dashboard',
      customers:    'Clientes',
      workers:      'Barberos',
      appointments: 'Citas / Agenda',
      sales:        'Ventas',
      products:     'Productos',
      inventory:    'Inventario',
      services:     'Catálogo de Servicios',
      finance:      'Finanzas',
      loyalty:      'Fidelización',
      reports:      'Reportes',
      settings:     'Configuración',
    };
    return titles[path] ?? 'BarberSystem';
  }

  navigateToQuickSale(): void {
    this.router.navigate(['/sales/quick']);
  }

  logout(): void {
    this.authService.logout();
  }
}
