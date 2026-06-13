import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Customer } from '../../../core/models/customer.model';
import { Worker } from '../../../core/models/worker.model';
import { BarberService } from '../../../core/models/service.model';
import { Product } from '../../../core/models/product.model';
import { SaleItem, PaymentMethod } from '../../../core/models/sale.model';
import { CustomerService } from '../../../data/repositories/customer.service';
import { WorkerService } from '../../../data/repositories/worker.service';
import { ServiceCatalogService } from '../../../data/repositories/service-catalog.service';
import { ProductService } from '../../../data/repositories/product.service';
import { SaleService } from '../../../data/repositories/sale.service';
import { forkJoin } from 'rxjs';

type SaleStep = 'setup' | 'items' | 'payment' | 'done';

@Component({
  selector: 'app-quick-sale',
  standalone: false,
  templateUrl: './quick-sale.component.html',
  styleUrls: ['./quick-sale.component.scss'],
})
export class QuickSaleComponent implements OnInit {
  step: SaleStep = 'setup';

  // Data
  customers: Customer[] = [];
  workers: Worker[] = [];
  services: BarberService[] = [];
  products: Product[] = [];

  // Selections
  selectedCustomer: Customer | null = null;
  selectedWorker: Worker | null = null;
  cartItems: SaleItem[] = [];
  selectedPayment: PaymentMethod = 'EFECTIVO';
  discount = 0;

  // Forms
  setupForm!: FormGroup;
  searchCustomer = '';
  searchService = '';
  searchProduct = '';

  // UI
  loading = false;
  saleCompleted = false;
  lastSaleId: number | null = null;
  itemTab = 0;

  readonly paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'EFECTIVO',      label: 'Efectivo',      icon: 'payments' },
    { value: 'TARJETA',       label: 'Tarjeta',       icon: 'credit_card' },
    { value: 'YAPE',          label: 'Yape',          icon: 'phone_android' },
    { value: 'PLIN',          label: 'Plin',          icon: 'phone_iphone' },
    { value: 'TRANSFERENCIA', label: 'Transferencia', icon: 'account_balance' },
  ];

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private workerService: WorkerService,
    private serviceCatalog: ServiceCatalogService,
    private productService: ProductService,
    private saleService: SaleService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    forkJoin({
      customers: this.customerService.getAll(),
      workers:   this.workerService.getActive(),
      services:  this.serviceCatalog.getActive(),
      products:  this.productService.getAll(),
    }).subscribe(({ customers, workers, services, products }) => {
      this.customers = customers;
      this.workers   = workers;
      this.services  = services;
      this.products  = products.filter(p => p.estado && p.stockActual > 0);
    });
  }

  // ─── Getters ─────────────────────────────────────────────────────────────────
  get filteredCustomers(): Customer[] {
    if (!this.searchCustomer) return this.customers;
    const s = this.searchCustomer.toLowerCase();
    return this.customers.filter(c =>
      `${c.nombre} ${c.apellido}`.toLowerCase().includes(s) || c.telefono.includes(s)
    );
  }

  get filteredServices(): BarberService[] {
    if (!this.searchService) return this.services;
    return this.services.filter(s => s.nombre.toLowerCase().includes(this.searchService.toLowerCase()));
  }

  get filteredProducts(): Product[] {
    if (!this.searchProduct) return this.products;
    return this.products.filter(p => p.nombre.toLowerCase().includes(this.searchProduct.toLowerCase()));
  }

  get subtotal(): number { return this.cartItems.reduce((a, i) => a + i.subtotal, 0); }
  get total(): number    { return this.subtotal - this.discount; }
  get cartCount(): number { return this.cartItems.reduce((a, i) => a + i.cantidad, 0); }

  // ─── Cart actions ────────────────────────────────────────────────────────────
  addService(service: BarberService): void {
    const existing = this.cartItems.find(i => i.tipo === 'SERVICIO' && i.itemId === service.id);
    if (existing) {
      existing.cantidad += 1;
      existing.subtotal = existing.precio * existing.cantidad;
    } else {
      this.cartItems.push({ tipo: 'SERVICIO', itemId: service.id, nombre: service.nombre, precio: service.precio, cantidad: 1, subtotal: service.precio });
    }
    this.snackBar.open(`${service.nombre} agregado`, '', { duration: 1200 });
  }

  addProduct(product: Product): void {
    const existing = this.cartItems.find(i => i.tipo === 'PRODUCTO' && i.itemId === product.id);
    if (existing) {
      if (existing.cantidad < product.stockActual) {
        existing.cantidad += 1;
        existing.subtotal = existing.precio * existing.cantidad;
      } else {
        this.snackBar.open('Stock insuficiente', '', { duration: 2000 });
      }
    } else {
      this.cartItems.push({ tipo: 'PRODUCTO', itemId: product.id, nombre: product.nombre, precio: product.precioVenta, cantidad: 1, subtotal: product.precioVenta });
    }
  }

  removeItem(index: number): void {
    this.cartItems.splice(index, 1);
  }

  decreaseItem(item: SaleItem): void {
    if (item.cantidad > 1) {
      item.cantidad -= 1;
      item.subtotal = item.precio * item.cantidad;
    } else {
      const idx = this.cartItems.indexOf(item);
      if (idx > -1) this.cartItems.splice(idx, 1);
    }
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────
  goToItems(): void {
    if (!this.selectedWorker) {
      this.snackBar.open('Selecciona un barbero', '', { duration: 2000 });
      return;
    }
    this.step = 'items';
  }

  goToPayment(): void {
    if (!this.cartItems.length) {
      this.snackBar.open('Agrega al menos un ítem', '', { duration: 2000 });
      return;
    }
    this.step = 'payment';
  }

  confirmSale(): void {
    this.loading = true;
    this.saleService.create({
      clienteId: this.selectedCustomer?.id,
      barberoId: this.selectedWorker!.id,
      items: [...this.cartItems],
      metodoPago: this.selectedPayment,
      descuento: this.discount,
    }).subscribe({
      next: (sale) => {
        this.lastSaleId = sale.id;
        this.step = 'done';
        this.loading = false;
        this.snackBar.open(`Venta #${sale.id} registrada correctamente`, '', { duration: 3000, panelClass: 'success-snack' });
      },
      error: (err: Error) => {
        this.loading = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000, panelClass: 'error-snack' });
      },
    });
  }

  newSale(): void {
    this.step = 'setup';
    this.selectedCustomer = null;
    this.selectedWorker   = null;
    this.cartItems = [];
    this.discount  = 0;
    this.selectedPayment = 'EFECTIVO';
    this.searchCustomer = '';
    this.lastSaleId = null;
  }

  // ─── Template helpers (evitan arrow functions en templates) ──────────────────
  getSelectedPaymentIcon(): string {
    return this.paymentMethods.find(p => p.value === this.selectedPayment)?.icon ?? 'payments';
  }

  getSelectedPaymentLabel(): string {
    return this.paymentMethods.find(p => p.value === this.selectedPayment)?.label ?? this.selectedPayment;
  }

  hasServicesInCart(): boolean {
    return this.cartItems.some(i => i.tipo === 'SERVICIO');
  }

  increaseServiceItem(item: SaleItem): void {
    const svc = this.services.find(s => s.id === item.itemId);
    if (svc) this.addService(svc);
  }

  getCustomerName(): string {
    return this.selectedCustomer ? this.selectedCustomer.nombre : '';
  }

  getWorkerFullName(): string {
    return this.selectedWorker ? `${this.selectedWorker.nombre} ${this.selectedWorker.apellido}` : '';
  }
}
