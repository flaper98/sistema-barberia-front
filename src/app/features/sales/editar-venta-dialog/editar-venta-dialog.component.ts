import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Sale, PaymentMethod, SaleItem, SalePago } from '../../../core/models/sale.model';
import { Customer } from '../../../core/models/customer.model';
import { WorkerSelector } from '../../../core/models/worker.model';
import { BarberService } from '../../../core/models/service.model';
import { Product } from '../../../core/models/product.model';
import { Paquete } from '../../../core/models/paquete.model';
import { SaleService } from '../../../data/repositories/sale.service';
import { CustomerService } from '../../../data/repositories/customer.service';
import { WorkerService } from '../../../data/repositories/worker.service';
import { ServiceCatalogService } from '../../../data/repositories/service-catalog.service';
import { ProductService } from '../../../data/repositories/product.service';
import { PaqueteService } from '../../../data/repositories/paquete.service';
import { matchesSearch } from '../../../core/utils/search.util';

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

  // Pago dividido en mas de un metodo (ej. mitad efectivo, mitad Yape) --
  // si la venta ya tenia mas de un tramo, se arranca directo en ese modo.
  splitMode = false;
  payments: { metodo: PaymentMethod; monto: number }[] = [];

  // Items de la venta -- copia local editable, se manda entera al guardar.
  items: SaleItem[];
  services: BarberService[] = [];
  products: Product[] = [];
  packages: Paquete[] = [];
  searchItem = '';
  itemTab = 0;

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
    private serviceCatalog: ServiceCatalogService,
    private productService: ProductService,
    private paqueteService: PaqueteService,
    private snackBar: MatSnackBar,
  ) {
    this.descuento = sale.descuento;
    this.notas = sale.notas ?? '';
    this.items = sale.items.map(i => ({ ...i }));

    // Si ya tenia mas de un tramo de pago, se arranca en modo dividido con
    // el mismo desglose (se puede ajustar). Si no, se parte de Efectivo
    // como punto de partida editable, igual que antes -- una solicitud de
    // barbero puede llegar sin metodo de pago todavia.
    if (sale.pagos && sale.pagos.length > 1) {
      this.splitMode = true;
      this.payments = sale.pagos.map(p => ({ metodo: p.metodoPago, monto: p.monto }));
      this.metodoPago = 'EFECTIVO';
    } else {
      this.metodoPago = sale.pagos?.[0]?.metodoPago ?? 'EFECTIVO';
      this.splitMode = false;
    }

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
      services: this.serviceCatalog.getActive(),
      products: this.productService.getAll(),
      packages: this.paqueteService.getActivos(),
    }).subscribe({
      next: ({ customers, workers, services, products, packages }) => {
        this.customers = customers;
        this.workers = workers;
        this.services = services;
        this.products = products.filter(p => p.estado && p.stockActual > 0);
        this.packages = packages;
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

  toggleWorker(w: WorkerSelector): void {
    this.selectedWorker = this.selectedWorker?.id === w.id ? null : w;
  }

  toggleCustomer(c: Customer): void {
    this.selectedCustomer = this.selectedCustomer?.id === c.id ? null : c;
  }

  get filteredCustomers(): Customer[] {
    return this.customers;
  }

  // ─── Items ───────────────────────────────────────────────────────────────
  get filteredServices(): BarberService[] {
    if (!this.searchItem) return this.services;
    return this.services.filter(s => matchesSearch(this.searchItem, s.nombre));
  }

  get filteredProducts(): Product[] {
    if (!this.searchItem) return this.products;
    return this.products.filter(p => matchesSearch(this.searchItem, p.nombre));
  }

  get filteredPackages(): Paquete[] {
    if (!this.searchItem) return this.packages;
    return this.packages.filter(p => matchesSearch(this.searchItem, p.nombre));
  }

  addService(service: BarberService): void {
    const existing = this.items.find(i => i.tipo === 'SERVICIO' && i.itemId === service.id);
    if (existing) {
      existing.cantidad += 1;
      existing.subtotal = existing.precio * existing.cantidad;
    } else {
      this.items.push({ tipo: 'SERVICIO', itemId: service.id, nombre: service.nombre, precio: service.precio, cantidad: 1, subtotal: service.precio });
    }
  }

  addPackage(paquete: Paquete): void {
    const existing = this.items.find(i => i.tipo === 'PAQUETE' && i.itemId === paquete.id);
    if (existing) {
      existing.cantidad += 1;
      existing.subtotal = existing.precio * existing.cantidad;
    } else {
      this.items.push({ tipo: 'PAQUETE', itemId: paquete.id, nombre: paquete.nombre, precio: paquete.precio, cantidad: 1, subtotal: paquete.precio });
    }
  }

  addProduct(product: Product): void {
    const existing = this.items.find(i => i.tipo === 'PRODUCTO' && i.itemId === product.id);
    if (existing) {
      if (existing.cantidad < product.stockActual) {
        existing.cantidad += 1;
        existing.subtotal = existing.precio * existing.cantidad;
      } else {
        this.snackBar.open('Stock insuficiente', '', { duration: 2000 });
      }
    } else {
      this.items.push({ tipo: 'PRODUCTO', itemId: product.id, nombre: product.nombre, precio: product.precioVenta, cantidad: 1, subtotal: product.precioVenta });
    }
  }

  increaseItem(item: SaleItem): void {
    item.cantidad += 1;
    item.subtotal = item.precio * item.cantidad;
  }

  decreaseItem(item: SaleItem): void {
    if (item.cantidad > 1) {
      item.cantidad -= 1;
      item.subtotal = item.precio * item.cantidad;
    } else {
      this.removeItem(item);
    }
  }

  removeItem(item: SaleItem): void {
    const idx = this.items.indexOf(item);
    if (idx > -1) this.items.splice(idx, 1);
  }

  get subtotal(): number {
    return this.items.reduce((a, i) => a + i.subtotal, 0);
  }

  get total(): number {
    return Math.max(0, this.subtotal - (this.descuento || 0));
  }

  // ─── Pago dividido ───────────────────────────────────────────────────────────
  enableSplit(): void {
    const segundo = this.paymentMethods.find(p => p.value !== this.metodoPago)!.value;
    this.payments = [
      { metodo: this.metodoPago, monto: this.total },
      { metodo: segundo, monto: 0 },
    ];
    this.splitMode = true;
  }

  addPaymentRow(): void {
    const usados = new Set(this.payments.map(p => p.metodo));
    const disponible = this.paymentMethods.find(p => !usados.has(p.value));
    if (!disponible) return;
    const restante = Math.max(0, this.total - this.paymentsSum);
    this.payments.push({ metodo: disponible.value, monto: restante });
  }

  removePaymentRow(i: number): void {
    this.payments.splice(i, 1);
    if (this.payments.length <= 1) {
      this.metodoPago = this.payments[0]?.metodo ?? 'EFECTIVO';
      this.payments = [];
      this.splitMode = false;
    }
  }

  get hayMetodosDisponibles(): boolean {
    return this.payments.length < this.paymentMethods.length;
  }

  get paymentsSum(): number {
    return this.payments.reduce((a, p) => a + (p.monto || 0), 0);
  }

  get paymentsMismatch(): boolean {
    return Math.abs(this.paymentsSum - this.total) > 0.005;
  }

  get paymentsDiffLabel(): string {
    const diff = this.total - this.paymentsSum;
    return diff > 0 ? `Falta S/ ${diff.toFixed(2)}` : `Sobra S/ ${Math.abs(diff).toFixed(2)}`;
  }

  // ─── Guardar ─────────────────────────────────────────────────────────────
  // Cliente y barbero son ambos opcionales -- no toda venta tiene uno u otro.
  get puedeGuardar(): boolean {
    if (this.saving || !this.items.length) return false;
    if (this.splitMode) return this.payments.length >= 2 && !this.paymentsMismatch;
    return true;
  }

  guardar(): void {
    if (!this.puedeGuardar) return;
    const pagos: SalePago[] = this.splitMode
      ? this.payments.map(p => ({ metodoPago: p.metodo, monto: p.monto }))
      : [{ metodoPago: this.metodoPago, monto: this.total }];
    this.saving = true;
    this.saleService.update(this.sale.id, {
      clienteId: this.selectedCustomer?.id,
      barberoId: this.selectedWorker?.id,
      pagos,
      descuento: this.descuento || 0,
      notas: this.notas || undefined,
      items: this.items.map(({ tipo, itemId, nombre, precio, cantidad }) => ({ tipo, itemId, nombre, precio, cantidad })),
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
