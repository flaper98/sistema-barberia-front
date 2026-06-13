import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoyaltyAccount } from '../../../core/models/loyalty.model';
import { LoyaltyService } from '../../../data/repositories/loyalty.service';

@Component({ selector: 'app-loyalty-dashboard', standalone: false, templateUrl: './loyalty-dashboard.component.html', styleUrls: ['./loyalty-dashboard.component.scss'] })
export class LoyaltyDashboardComponent implements OnInit {
  accounts: LoyaltyAccount[] = [];
  filtered: LoyaltyAccount[] = [];
  search = '';
  loading = true;
  activeTab = 0;

  constructor(private loyaltyService: LoyaltyService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loyaltyService.getAccounts().subscribe(data => {
      this.accounts = data;
      this.applyFilter();
      this.loading = false;
    });
  }

  applyFilter(): void {
    let list = [...this.accounts];
    if (this.activeTab === 1) list = list.filter(a => a.recompensasDisponibles > 0);
    if (this.search) {
      const s = this.search.toLowerCase();
      list = list.filter(a => a.clienteNombre.toLowerCase().includes(s));
    }
    this.filtered = list.sort((a, b) => b.sellosActuales - a.sellosActuales);
  }

  getStampArray(): number[] { return Array.from({ length: 5 }, (_, i) => i); }

  redeem(account: LoyaltyAccount): void {
    this.loyaltyService.redeemReward(account.clienteId, account.clienteNombre).subscribe({
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

  onTabChange(idx: number): void { this.activeTab = idx; this.applyFilter(); }
}
