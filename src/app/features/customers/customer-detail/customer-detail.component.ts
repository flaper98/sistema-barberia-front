import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { Customer } from '../../../core/models/customer.model';
import { Sale } from '../../../core/models/sale.model';
import { Appointment } from '../../../core/models/appointment.model';
import { LoyaltyAccount, LoyaltyMovement, Reward } from '../../../core/models/loyalty.model';
import { CustomerService } from '../../../data/repositories/customer.service';
import { SaleService } from '../../../data/repositories/sale.service';
import { AppointmentService } from '../../../data/repositories/appointment.service';
import { LoyaltyService } from '../../../data/repositories/loyalty.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';

@Component({
  selector: 'app-customer-detail',
  standalone: false,
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.scss'],
})
export class CustomerDetailComponent implements OnInit {
  customer: Customer | null = null;
  sales: Sale[] = [];
  appointments: Appointment[] = [];
  loyaltyAccount: LoyaltyAccount | null = null;
  loyaltyMovements: LoyaltyMovement[] = [];
  descripcionRecompensa = '';
  loading = true;
  editandoRecompensa = false;
  descripcionRecompensaEditada = '';
  premios: Reward[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private saleService: SaleService,
    private appointmentService: AppointmentService,
    private loyaltyService: LoyaltyService,
    private authService: AuthService,
    private permissionService: PermissionService,
    private snackBar: MatSnackBar,
  ) {}

  get puedeEditarCliente(): boolean {
    return this.authService.hasRole(['ADMIN']) || this.permissionService.canEdit('CLIENTES');
  }

  get puedeEditarFidelizacion(): boolean {
    return this.authService.hasRole(['ADMIN']) || this.permissionService.canEdit('FIDELIZACION');
  }

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    forkJoin({
      customer:   this.customerService.getById(id),
      sales:      this.saleService.search({ }),
      appointments: this.appointmentService.search({ clienteId: id }),
      loyalty:    this.loyaltyService.getByCustomer(id),
      movements:  this.loyaltyService.getMovementsByCustomer(id),
      loyaltyConfig: this.loyaltyService.getConfig(),
      premios:    this.loyaltyService.getRewards(),
    }).subscribe({
      next: ({ customer, sales, appointments, loyalty, movements, loyaltyConfig, premios }) => {
        this.customer = customer;
        this.sales = sales.filter(s => s.clienteId === id);
        this.appointments = appointments;
        this.loyaltyAccount = loyalty;
        this.loyaltyMovements = movements;
        this.descripcionRecompensa = loyaltyConfig.descripcionRecompensa || 'Recompensa';
        this.premios = premios;
        this.loading = false;
      },
      error: (err: Error) => {
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
        this.router.navigate(['/customers']);
      },
    });
  }

  redeemReward(): void {
    if (!this.customer) return;
    this.loyaltyService.redeemReward(this.customer.id).subscribe({
      next: (acc) => {
        if (this.loyaltyAccount) {
          this.loyaltyAccount = {
            ...this.loyaltyAccount,
            sellosActuales: acc.sellosActuales,
            sellosNecesarios: acc.sellosNecesarios,
            recompensasDisponibles: acc.recompensasDisponibles,
          };
        }
        this.customer!.recompensasDisponibles = acc.recompensasDisponibles;
        this.snackBar.open('Recompensa canjeada exitosamente', '', { duration: 3000 });
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 3000 }),
    });
  }

  addStamp(): void {
    if (!this.customer) return;
    this.loyaltyService.addStamp(this.customer.id).subscribe({
      next: (acc) => {
        if (this.loyaltyAccount) {
          this.loyaltyAccount = {
            ...this.loyaltyAccount,
            sellosActuales: acc.sellosActuales,
            sellosNecesarios: acc.sellosNecesarios,
            recompensasDisponibles: acc.recompensasDisponibles,
          };
        }
        this.customer!.cantidadSellos = acc.sellosActuales;
        this.customer!.recompensasDisponibles = acc.recompensasDisponibles;
        this.snackBar.open(acc.mensaje, '', { duration: 3000 });
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 3000 }),
    });
  }

  getStampArray(count: number): number[] { return Array.from({ length: count }, (_, i) => i); }
  formatId(id: number): string { return id.toString().padStart(4, '0'); }

  empezarEdicionRecompensa(): void {
    this.descripcionRecompensaEditada = this.loyaltyAccount?.descripcionRecompensa ?? this.descripcionRecompensa;
    this.editandoRecompensa = true;
  }

  cancelarEdicionRecompensa(): void {
    this.editandoRecompensa = false;
  }

  guardarRecompensa(): void {
    if (!this.customer) return;
    this.loyaltyService.updateRewardDescription(this.customer.id, this.descripcionRecompensaEditada.trim()).subscribe({
      next: (acc) => {
        if (this.loyaltyAccount) {
          this.loyaltyAccount = { ...this.loyaltyAccount, descripcionRecompensa: acc.descripcionRecompensa };
        }
        this.editandoRecompensa = false;
        this.snackBar.open('Recompensa actualizada', '', { duration: 2000 });
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
  }
  getStatusClass(s: string): string { return s.toLowerCase().replace('_', '-'); }
}
