import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { User } from '../../core/models/user.model';
import { AppNotification } from '../../core/models/notification.model';
import { NotificationService } from '../../data/repositories/notification.service';
import { ChangePasswordDialogComponent } from './change-password-dialog/change-password-dialog.component';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Output() menuToggle = new EventEmitter<void>();

  unreadCount = 0;
  notifications: AppNotification[] = [];
  private pollSub?: Subscription;

  constructor(
    public authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    // No hay WebSocket/push en este proyecto -- se sondea la cantidad de no
    // leidas cada 30s, alcanza de sobra para el volumen de una barberia.
    this.pollSub = interval(30000).pipe(
      startWith(0),
      switchMap(() => this.notificationService.getUnreadCount()),
    ).subscribe({
      next: count => (this.unreadCount = count),
      error: () => {},
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  onNotifMenuOpened(): void {
    this.notificationService.getAll(false, 15).subscribe({
      next: list => (this.notifications = list),
      error: () => {},
    });
  }

  onNotifClick(n: AppNotification): void {
    if (!n.leida) {
      this.notificationService.markRead(n.id).subscribe(() => {
        n.leida = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      });
    }
    if (n.entidadTipo === 'CITA') {
      this.router.navigate(['/appointments']);
    } else if (n.entidadTipo === 'VENTA') {
      this.router.navigate(['/sales/list'], { queryParams: { estado: 'PENDIENTE' } });
    }
  }

  marcarTodasLeidas(): void {
    this.notificationService.markAllRead().subscribe(() => {
      this.notifications.forEach(n => (n.leida = true));
      this.unreadCount = 0;
    });
  }

  cambiarPassword(): void {
    this.dialog.open(ChangePasswordDialogComponent, { width: '400px' });
  }

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
      commissions:  'Comisiones',
      loyalty:      'Fidelización',
      reports:      'Reportes',
      settings:     'Configuración',
    };
    return titles[path] ?? 'Árabes Barber Studio';
  }

  navigateToQuickSale(): void {
    this.router.navigate(['/sales/quick']);
  }

  logout(): void {
    this.authService.logout();
  }
}
