import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoyaltyAccount } from '../../../core/models/loyalty.model';
import { LoyaltyService } from '../../../data/repositories/loyalty.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { matchesSearch } from '../../../core/utils/search.util';

@Component({ selector: 'app-loyalty-dashboard', standalone: false, templateUrl: './loyalty-dashboard.component.html', styleUrls: ['./loyalty-dashboard.component.scss'] })
export class LoyaltyDashboardComponent implements OnInit {
  accounts: LoyaltyAccount[] = [];
  filtered: LoyaltyAccount[] = [];
  search = '';
  loading = true;
  activeTab = 0;
  descripcionRecompensa = '';

  constructor(
    private loyaltyService: LoyaltyService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private permissionService: PermissionService,
  ) {}

  get puedeEditar(): boolean {
    return this.authService.hasRole(['ADMIN']) || this.permissionService.canEdit('FIDELIZACION');
  }

  ngOnInit(): void {
    this.loyaltyService.getConfig().subscribe({
      next: cfg => (this.descripcionRecompensa = cfg.descripcionRecompensa || 'Recompensa'),
      error: () => {},
    });

    this.loyaltyService.getAccounts().subscribe({
      next: data => {
        this.accounts = data;
        this.applyFilter();
        this.loading = false;
      },
      error: (err: Error) => { this.loading = false; this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }); },
    });
  }

  applyFilter(): void {
    let list = [...this.accounts];
    if (this.activeTab === 1) list = list.filter(a => a.recompensasDisponibles > 0);
    if (this.search) {
      list = list.filter(a => matchesSearch(this.search, a.clienteNombre));
    }
    this.filtered = list.sort((a, b) => b.sellosActuales - a.sellosActuales);
  }

  getStampArray(acc: LoyaltyAccount): number[] { return Array.from({ length: acc.sellosNecesarios }, (_, i) => i); }

  redeem(account: LoyaltyAccount): void {
    this.loyaltyService.redeemReward(account.clienteId).subscribe({
      next: (updated) => {
        const idx = this.accounts.findIndex(a => a.clienteId === account.clienteId);
        if (idx > -1) {
          this.accounts[idx] = {
            ...this.accounts[idx],
            sellosActuales: updated.sellosActuales,
            sellosNecesarios: updated.sellosNecesarios,
            recompensasDisponibles: updated.recompensasDisponibles,
          };
        }
        this.applyFilter();
        this.snackBar.open('Recompensa canjeada', '', { duration: 2500 });
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 3000 }),
    });
  }

  addStamp(account: LoyaltyAccount): void {
    this.loyaltyService.addStamp(account.clienteId).subscribe({
      next: (updated) => {
        const idx = this.accounts.findIndex(a => a.clienteId === account.clienteId);
        if (idx > -1) {
          this.accounts[idx] = {
            ...this.accounts[idx],
            sellosActuales: updated.sellosActuales,
            sellosNecesarios: updated.sellosNecesarios,
            recompensasDisponibles: updated.recompensasDisponibles,
          };
        }
        this.applyFilter();
        this.snackBar.open(updated.mensaje, '', { duration: 2500 });
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 3000 }),
    });
  }

  onTabChange(idx: number): void { this.activeTab = idx; this.applyFilter(); }
}
