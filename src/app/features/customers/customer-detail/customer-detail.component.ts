import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { Customer } from '../../../core/models/customer.model';
import { Sale } from '../../../core/models/sale.model';
import { Appointment } from '../../../core/models/appointment.model';
import { LoyaltyAccount, LoyaltyMovement } from '../../../core/models/loyalty.model';
import { CustomerService } from '../../../data/repositories/customer.service';
import { SaleService } from '../../../data/repositories/sale.service';
import { AppointmentService } from '../../../data/repositories/appointment.service';
import { LoyaltyService } from '../../../data/repositories/loyalty.service';

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
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private saleService: SaleService,
    private appointmentService: AppointmentService,
    private loyaltyService: LoyaltyService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    forkJoin({
      customer:   this.customerService.getById(id),
      sales:      this.saleService.search({ }),
      appointments: this.appointmentService.search({ clienteId: id }),
      loyalty:    this.loyaltyService.getByCustomer(id),
      movements:  this.loyaltyService.getMovementsByCustomer(id),
    }).subscribe({
      next: ({ customer, sales, appointments, loyalty, movements }) => {
        this.customer = customer;
        this.sales = sales.filter(s => s.clienteId === id);
        this.appointments = appointments;
        this.loyaltyAccount = loyalty;
        this.loyaltyMovements = movements;
        this.loading = false;
      },
      error: () => { this.router.navigate(['/customers']); },
    });
  }

  redeemReward(): void {
    if (!this.customer) return;
    this.loyaltyService.redeemReward(this.customer.id, `${this.customer.nombre} ${this.customer.apellido}`).subscribe({
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

  getStampArray(count: number): number[] { return Array.from({ length: 5 }, (_, i) => i); }
  getStatusClass(s: string): string { return s.toLowerCase().replace('_', '-'); }
}
