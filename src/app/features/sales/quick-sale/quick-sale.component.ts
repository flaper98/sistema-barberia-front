import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Customer } from '../../../core/models/customer.model';
import { WorkerSelector } from '../../../core/models/worker.model';
import { BarberService } from '../../../core/models/service.model';
import { Product } from '../../../core/models/product.model';
import { Paquete } from '../../../core/models/paquete.model';
import { SaleItem, PaymentMethod } from '../../../core/models/sale.model';
import { Appointment } from '../../../core/models/appointment.model';
import { CustomerService } from '../../../data/repositories/customer.service';
import { WorkerService } from '../../../data/repositories/worker.service';
import { ServiceCatalogService } from '../../../data/repositories/service-catalog.service';
import { ProductService } from '../../../data/repositories/product.service';
import { PaqueteService } from '../../../data/repositories/paquete.service';
import { SaleService } from '../../../data/repositories/sale.service';
import { AppointmentService } from '../../../data/repositories/appointment.service';
import { AuthService } from '../../../core/auth/auth.service';
import { matchesSearch } from '../../../core/utils/search.util';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
  // El cliente puede ser cualquiera de los 1000+ registrados -- se busca en
  // el servidor a medida que se escribe (debounced), no se cargan todos de
  // una vez. Antes usaba customerService.getAll() esperando traerlos todos,
  // pero el backend limita el tamaño de pagina a 200 (por rendimiento, ver
  // ClienteController) asi que en silencio solo llegaban los primeros 200
  // por ID -- cualquier cliente con ID mas alto (ej. "Flavio Alexandro
  // Perez", ID 236) directamente no aparecia en la busqueda.
  customers: Customer[] = [];
  private searchCustomerChanged = new Subject<string>();
  workers: WorkerSelector[] = [];
  services: BarberService[] = [];
  products: Product[] = [];
  packages: Paquete[] = [];

  // Selections
  selectedCustomer: Customer | null = null;
  selectedWorker: WorkerSelector | null = null;
  cartItems: SaleItem[] = [];
  selectedPayment: PaymentMethod = 'EFECTIVO';
  discount = 0;
  montoRecibido: number | null = null;

  // Origen: cita que se está cobrando (si se llegó desde "Atender y cobrar")
  citaId: number | null = null;
  citaOrigen: Appointment | null = null;

  // Forms
  setupForm!: FormGroup;
  searchCustomer = '';
  searchService = '';
  searchProduct = '';
  searchPackage = '';

  // UI
  loading = false;
  saleCompleted = false;
  lastSaleId: number | null = null;
  lastSaleEstado: string | null = null;
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
    private paqueteService: PaqueteService,
    private saleService: SaleService,
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.searchCustomerChanged.pipe(debounceTime(300), distinctUntilChanged()).subscribe(term => {
      this.loadCustomers(term);
    });
  }

  get esBarbero(): boolean {
    return this.authService.hasRole(['BARBER']);
  }

  ngOnInit(): void {
    forkJoin({
      customers: this.customerService.search({ size: 20 }),
      workers:   this.workerService.getForSale(),
      services:  this.serviceCatalog.getActive(),
      products:  this.productService.getAll(),
      packages:  this.paqueteService.getActivos(),
    }).subscribe({
      next: ({ customers, workers, services, products, packages }) => {
        this.customers = customers;
        this.workers   = workers;
        this.services  = services;
        this.products  = products.filter(p => p.estado && p.stockActual > 0);
        this.packages  = packages;

        if (this.esBarbero) {
          const miBarberoId = this.authService.currentUser?.barberoId;
          this.selectedWorker = this.workers.find(w => w.id === miBarberoId) ?? null;
        }

        const citaIdParam = this.route.snapshot.queryParamMap.get('citaId');
        if (citaIdParam) {
          this.cargarDesdeCita(+citaIdParam);
        }
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
  }

  private loadCustomers(search?: string): void {
    this.customerService.search({ search: search || undefined, size: 20 }).subscribe({
      next: customers => (this.customers = customers),
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
  }

  onSearchCustomerChange(): void {
    this.searchCustomerChanged.next(this.searchCustomer);
  }

  private cargarDesdeCita(citaId: number): void {
    this.appointmentService.getById(citaId).subscribe({
      next: cita => {
        this.citaId = citaId;
        this.citaOrigen = cita;

        this.selectedWorker = this.workers.find(w => w.id === cita.barberoId) ?? null;
        this.selectedCustomer = null;
        if (cita.clienteId) {
          // El cliente de la cita puede no estar entre los primeros 20
          // cargados por defecto -- se busca directo por ID.
          this.customerService.getById(cita.clienteId).subscribe({
            next: c => (this.selectedCustomer = c),
            error: () => {},
          });
        }

        this.cartItems = cita.servicios.map(s => ({
          tipo: 'SERVICIO' as const,
          itemId: s.servicioId,
          nombre: s.servicioNombre,
          precio: s.precio,
          cantidad: 1,
          subtotal: s.precio,
        }));

        this.step = this.selectedWorker ? 'items' : 'setup';
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
  }

  // ─── Getters ─────────────────────────────────────────────────────────────────
  get filteredCustomers(): Customer[] {
    // La busqueda ya se resuelve en el servidor (ver onSearchCustomerChange) --
    // this.customers siempre es lo que hay que mostrar.
    return this.customers;
  }

  get filteredServices(): BarberService[] {
    if (!this.searchService) return this.services;
    return this.services.filter(s => matchesSearch(this.searchService, s.nombre));
  }

  get filteredProducts(): Product[] {
    if (!this.searchProduct) return this.products;
    return this.products.filter(p => matchesSearch(this.searchProduct, p.nombre));
  }

  get filteredPackages(): Paquete[] {
    if (!this.searchPackage) return this.packages;
    return this.packages.filter(p => matchesSearch(this.searchPackage, p.nombre));
  }

  get subtotal(): number { return this.cartItems.reduce((a, i) => a + i.subtotal, 0); }
  get total(): number    { return this.subtotal - this.discount; }
  get cartCount(): number { return this.cartItems.reduce((a, i) => a + i.cantidad, 0); }

  get vuelto(): number {
    if (this.montoRecibido == null) return 0;
    return Math.max(0, this.montoRecibido - this.total);
  }

  get pagoInsuficiente(): boolean {
    return this.selectedPayment === 'EFECTIVO' && this.montoRecibido != null && this.montoRecibido < this.total;
  }

  get puedeConfirmar(): boolean {
    if (this.loading) return false;
    if (this.selectedPayment === 'EFECTIVO') return this.montoRecibido != null && this.montoRecibido >= this.total;
    return true;
  }

  // ─── Cart actions ────────────────────────────────────────────────────────────
  addService(service: BarberService): void {
    const existing = this.cartItems.find(i => i.tipo === 'SERVICIO' && i.itemId === service.id);
    if (existing) {
      existing.cantidad += 1;
      existing.subtotal = existing.precio * existing.cantidad;
    } else {
      this.cartItems.push({
        tipo: 'SERVICIO', itemId: service.id, nombre: service.nombre, precio: service.precio,
        cantidad: 1, subtotal: service.precio, precioEditable: service.precioVariable,
      });
    }
    this.snackBar.open(`${service.nombre} agregado`, '', { duration: 1200 });
  }

  addPackage(paquete: Paquete): void {
    const existing = this.cartItems.find(i => i.tipo === 'PAQUETE' && i.itemId === paquete.id);
    if (existing) {
      existing.cantidad += 1;
      existing.subtotal = existing.precio * existing.cantidad;
    } else {
      this.cartItems.push({ tipo: 'PAQUETE', itemId: paquete.id, nombre: paquete.nombre, precio: paquete.precio, cantidad: 1, subtotal: paquete.precio });
    }
    this.snackBar.open(`${paquete.nombre} agregado`, '', { duration: 1200 });
  }

  updateItemPrice(item: SaleItem, value: number): void {
    const nuevoPrecio = Number(value);
    if (!isFinite(nuevoPrecio) || nuevoPrecio < 0) return;
    item.precio = nuevoPrecio;
    item.subtotal = item.precio * item.cantidad;
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
    if (!this.selectedCustomer) {
      this.snackBar.open('Selecciona un cliente', '', { duration: 2000 });
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
    const form = {
      clienteId: this.selectedCustomer?.id,
      barberoId: this.selectedWorker!.id,
      items: this.cartItems.map(({ tipo, itemId, nombre, precio, cantidad, subtotal }) =>
        ({ tipo, itemId, nombre, precio, cantidad, subtotal })),
      metodoPago: this.selectedPayment,
      descuento: this.discount,
    };
    const op$ = this.citaId
      ? this.appointmentService.convertToSale(this.citaId, form)
      : this.saleService.create(form);

    op$.subscribe({
      next: (sale) => {
        this.lastSaleId = sale.id;
        this.lastSaleEstado = sale.estado;
        this.step = 'done';
        this.loading = false;
        const msg = sale.estado === 'PENDIENTE'
          ? `Solicitud #${sale.id} enviada — recepción la va a cobrar`
          : this.citaId
            ? `Cita atendida y venta #${sale.id} registrada`
            : `Venta #${sale.id} registrada correctamente`;
        this.snackBar.open(msg, '', { duration: 3000, panelClass: 'success-snack' });
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
    this.montoRecibido = null;
    this.searchCustomer = '';
    this.lastSaleId = null;
    this.lastSaleEstado = null;
    this.citaId = null;
    this.citaOrigen = null;
    this.router.navigate(['/sales/quick']);
  }

  selectPayment(method: PaymentMethod): void {
    this.selectedPayment = method;
    this.montoRecibido = null;
  }

  // ─── Template helpers (evitan arrow functions en templates) ──────────────────
  getSelectedPaymentIcon(): string {
    return this.paymentMethods.find(p => p.value === this.selectedPayment)?.icon ?? 'payments';
  }

  getSelectedPaymentLabel(): string {
    return this.paymentMethods.find(p => p.value === this.selectedPayment)?.label ?? this.selectedPayment;
  }

  hasServicesInCart(): boolean {
    return this.cartItems.some(i => i.tipo === 'SERVICIO' || i.tipo === 'PAQUETE');
  }

  increaseServiceItem(item: SaleItem): void {
    const svc = this.services.find(s => s.id === item.itemId);
    if (svc) this.addService(svc);
  }

  increasePackageItem(item: SaleItem): void {
    const pkg = this.packages.find(p => p.id === item.itemId);
    if (pkg) this.addPackage(pkg);
  }

  getCustomerName(): string {
    return this.selectedCustomer ? this.selectedCustomer.nombre : '';
  }

  getWorkerFullName(): string {
    return this.selectedWorker ? `${this.selectedWorker.nombre} ${this.selectedWorker.apellido}` : '';
  }
}
