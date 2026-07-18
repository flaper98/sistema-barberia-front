import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Sale, PaymentMethod } from '../../../core/models/sale.model';
import { Customer } from '../../../core/models/customer.model';
import { WorkerSelector } from '../../../core/models/worker.model';
import { SaleService } from '../../../data/repositories/sale.service';
import { CustomerService } from '../../../data/repositories/customer.service';
import { WorkerService } from '../../../data/repositories/worker.service';

@Component({
  selector: 'app-editar-venta-dialog',
  standalone: false,
  templateUrl: './editar-venta-dialog.component.html',
  styleUrls: ['./editar-venta-dialog.component.scss'],
})
export class EditarVentaDialogComponent implements OnInit {
  loading = true;
  saving = false;

  // Se busca en el servidor a medida que se escribe -- ver comentario en
  // quick-sale.component.ts sobre por que no se puede cargar todo de una
  // con customerService.getAll() (el backend limita a 200 por pagina).
  customers: Customer[] = [];
  workers: WorkerSelector[] = [];
  searchCustomer = '';
  private searchCustomerChanged = new Subject<string>();

  selectedCustomer: Customer | null = null;
  selectedWorker: WorkerSelector | null = null;
  metodoPago: PaymentMethod;
  descuento: number;
  notas: string;

  readonly paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'EFECTIVO',      label: 'Efectivo',      icon: 'payments' },
    { value: 'TARJETA',       label: 'Tarjeta',       icon: 'credit_card' },
    { value: 'YAPE',          label: 'Yape',          icon: 'phone_android' },
    { value: 'PLIN',          label: 'Plin',          icon: 'phone_iphone' },
    { value: 'TRANSFERENCIA', label: 'Transferencia', icon: 'account_balance' },
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public sale: Sale,
    private dialogRef: MatDialogRef<EditarVentaDialogComponent>,
    private saleService: SaleService,
    private customerService: CustomerService,
    private workerService: WorkerService,
    private snackBar: MatSnackBar,
  ) {
    this.metodoPago = sale.metodoPago;
    this.descuento = sale.descuento;
    this.notas = sale.notas ?? '';

    this.searchCustomerChanged.pipe(debounceTime(300), distinctUntilChanged()).subscribe(term => {
      this.customerService.search({ search: term || undefined, size: 20 }).subscribe({
        next: customers => (this.customers = customers),
        error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
      });
    });
  }

  ngOnInit(): void {
    forkJoin({
      customers: this.customerService.search({ size: 20 }),
      workers: this.workerService.getForSale(),
    }).subscribe({
      next: ({ customers, workers }) => {
        this.customers = customers;
        this.workers = workers;
        this.selectedWorker = workers.find(w => w.id === this.sale.barberoId) ?? null;
        this.loading = false;
      },
      error: (err: Error) => {
        this.loading = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });

    // El cliente actual de la venta puede no estar entre los primeros 20
    // cargados por defecto -- se busca directo por ID, no en la lista local.
    if (this.sale.clienteId) {
      this.customerService.getById(this.sale.clienteId).subscribe({
        next: c => (this.selectedCustomer = c),
        error: () => {},
      });
    }
  }

  onSearchCustomerChange(): void {
    this.searchCustomerChanged.next(this.searchCustomer);
  }

  get filteredCustomers(): Customer[] {
    return this.customers;
  }

  get puedeGuardar(): boolean {
    return !this.saving && !!this.selectedCustomer && !!this.selectedWorker;
  }

  guardar(): void {
    if (!this.selectedCustomer || !this.selectedWorker) return;
    this.saving = true;
    this.saleService.update(this.sale.id, {
      clienteId: this.selectedCustomer.id,
      barberoId: this.selectedWorker.id,
      metodoPago: this.metodoPago,
      descuento: this.descuento || 0,
      notas: this.notas || undefined,
    }).subscribe({
      next: (updated) => {
        this.snackBar.open(`Venta #${updated.id} actualizada`, '', { duration: 3000, panelClass: 'success-snack' });
        this.dialogRef.close(updated);
      },
      error: (err: Error) => {
        this.saving = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
