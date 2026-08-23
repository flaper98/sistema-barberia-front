import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Customer, CustomerSelector } from '../../../core/models/customer.model';
import { WorkerSelector } from '../../../core/models/worker.model';
import { BarberService } from '../../../core/models/service.model';
import { Product } from '../../../core/models/product.model';
import { Paquete } from '../../../core/models/paquete.model';
import { SaleItem, PaymentMethod, SalePago } from '../../../core/models/sale.model';
import { Appointment } from '../../../core/models/appointment.model';
import { CustomerService } from '../../../data/repositories/customer.service';
import { WorkerService } from '../../../data/repositories/worker.service';
import { ServiceCatalogService } from '../../../data/repositories/service-catalog.service';
import { ProductService } from '../../../data/repositories/product.service';
import { PaqueteService } from '../../../data/repositories/paquete.service';
import { SaleService } from '../../../data/repositories/sale.service';
import { AppointmentService } from '../../../data/repositories/appointment.service';
import { AuthService } from '../../../core/auth/auth.service';
import { LoyaltyService } from '../../../data/repositories/loyalty.service';
import { LoyaltyPreview } from '../../../core/models/loyalty.model';
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

  // El barbero puede opcionalmente indicar el cliente de la solicitud --
  // usa una lista y seleccion APARTE (no comparte customers/selectedCustomer
  // de arriba, que son para el paso "Inicio" de ADMIN/CASHIER/RECEPTION):
  // viene de /customers/for-sale (solo nombre y apellido, ver
  // CustomerSelector), que no depende del permiso del modulo Clientes -- el
  // barbero puede no tenerlo. Si el cliente no está registrado todavía,
  // puede dejar sus datos como texto libre (van en "notas") para que
  // recepción lo registre al aceptar y cobrar -- ver confirmar-venta-dialog,
  // que ya tiene un alta rápida de cliente ahí.
  barberoCustomers: CustomerSelector[] = [];
  selectedBarberoCustomer: CustomerSelector | null = null;
  // Mutuamente excluyente con selectedCustomer (ver toggleCustomer/
  // toggleClienteNoRegistrado).
  mostrarClienteNoRegistrado = false;
  clienteNoRegNombre = '';
  clienteNoRegTelefono = '';

  // Pago dividido en mas de un metodo (ej. mitad efectivo, mitad Yape) --
  // splitMode=false es el caso comun (un solo metodo, cubre el total
  // completo); al activarlo, cada fila de "payments" necesita su propio
  // monto y la suma tiene que coincidir con el total.
  splitMode = false;
  payments: { metodo: PaymentMethod; monto: number }[] = [];

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

  // Aviso ANTES de cobrar: si con esta venta el cliente completa (una o mas
  // veces) su sello de fidelizacion -- ver LoyaltyService.previewParaVenta.
  loyaltyPreview: LoyaltyPreview | null = null;

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
    private loyaltyService: LoyaltyService,
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
    // El cliente (para ADMIN/CASHIER/RECEPTION en el paso "Inicio", ver
    // customers/selectedCustomer) se carga aparte de este forkJoin -- para
    // el barbero va por /customers/for-sale (ver loadCustomers), que no
    // depende del permiso del modulo Clientes; para el resto es la busqueda
    // completa. Ninguna de las dos debe bloquear el resto de la pantalla.
    forkJoin({
      workers:   this.workerService.getForSale(),
      services:  this.serviceCatalog.getActive(),
      products:  this.productService.getAll(),
      packages:  this.paqueteService.getActivos(),
    }).subscribe({
      next: ({ workers, services, products, packages }) => {
        this.workers   = workers;
        this.services  = services;
        this.products  = products.filter(p => p.estado && p.stockActual > 0);
        this.packages  = packages;
        this.loadCustomers();

        if (this.esBarbero) {
          const miBarberoId = this.authService.currentUser?.barberoId;
          this.selectedWorker = this.workers.find(w => w.id === miBarberoId) ?? null;
        }

        const citaIdParam = this.route.snapshot.queryParamMap.get('citaId');
        if (citaIdParam) {
          this.cargarDesdeCita(+citaIdParam);
        } else if (this.esBarbero && this.selectedWorker) {
          // El barbero ya es el barbero de la venta (es el mismo que la
          // registra) y el metodo de pago lo asigna recepcion al aceptar y
          // cobrar -- asi que salta directo a Items, sin pasar por el paso
          // "Inicio" (el cliente, opcional, se elige dentro de Items).
          this.step = 'items';
        }
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
  }

  private loadCustomers(search?: string): void {
    if (this.esBarbero) {
      this.customerService.searchForSale(search || undefined).subscribe({
        next: customers => (this.barberoCustomers = customers),
        error: () => {},
      });
      return;
    }
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

  get paymentsSum(): number {
    return this.payments.reduce((a, p) => a + (p.monto || 0), 0);
  }

  // Tolerancia chica por redondeo de centavos, no por indulgencia real.
  get paymentsMismatch(): boolean {
    return Math.abs(this.paymentsSum - this.total) > 0.005;
  }

  get paymentsDiffLabel(): string {
    const diff = this.total - this.paymentsSum;
    return diff > 0 ? `Falta S/ ${diff.toFixed(2)}` : `Sobra S/ ${Math.abs(diff).toFixed(2)}`;
  }

  get puedeConfirmar(): boolean {
    if (this.loading) return false;
    if (this.splitMode) return this.payments.length >= 2 && !this.paymentsMismatch;
    if (this.selectedPayment === 'EFECTIVO') return this.montoRecibido != null && this.montoRecibido >= this.total;
    return true;
  }

  // El barbero manda la solicitud directo desde Items -- sin cliente ni
  // metodo de pago, esos los asigna recepcion al aceptar y cobrar.
  get puedeEnviarSolicitud(): boolean {
    return !this.loading && this.cartItems.length > 0;
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

  // Clickear la tarjeta ya seleccionada la deselecciona -- asi se puede
  // volver atras sin recargar la pantalla, ya que ambos son opcionales.
  toggleWorker(w: WorkerSelector): void {
    this.selectedWorker = this.selectedWorker?.id === w.id ? null : w;
  }

  toggleCustomer(c: Customer): void {
    this.selectedCustomer = this.selectedCustomer?.id === c.id ? null : c;
  }

  // Version para el cliente (opcional) que elige el barbero en el paso de
  // Items -- ver selectedBarberoCustomer/barberoCustomers.
  toggleBarberoCustomer(c: CustomerSelector): void {
    this.selectedBarberoCustomer = this.selectedBarberoCustomer?.id === c.id ? null : c;
    if (this.selectedBarberoCustomer) this.cancelarClienteNoRegistrado();
  }

  // Cliente sin registrar (solo relevante para el barbero): mutuamente
  // excluyente con selectedBarberoCustomer -- elegir uno cancela el otro.
  toggleClienteNoRegistrado(): void {
    this.mostrarClienteNoRegistrado = !this.mostrarClienteNoRegistrado;
    if (this.mostrarClienteNoRegistrado) {
      this.selectedBarberoCustomer = null;
    } else {
      this.clienteNoRegNombre = '';
      this.clienteNoRegTelefono = '';
    }
  }

  cancelarClienteNoRegistrado(): void {
    this.mostrarClienteNoRegistrado = false;
    this.clienteNoRegNombre = '';
    this.clienteNoRegTelefono = '';
  }

  soloNumerosClienteNoReg(event: Event): void {
    const input = event.target as HTMLInputElement;
    const limpio = input.value.replace(/\D/g, '');
    if (limpio !== input.value) this.clienteNoRegTelefono = limpio;
  }

  // Texto libre para "notas" cuando el barbero dejó datos de un cliente
  // que todavia no esta registrado -- recepcion lo lee al aceptar y cobrar
  // (ver confirmar-venta-dialog) para darlo de alta ahí mismo.
  private get notasClienteNoRegistrado(): string | undefined {
    const nombre = this.clienteNoRegNombre.trim();
    if (!this.mostrarClienteNoRegistrado || !nombre) return undefined;
    const tel = this.clienteNoRegTelefono.trim();
    return `Cliente nuevo (sin registrar): ${nombre}${tel ? ' - Tel: ' + tel : ''}`;
  }

  // Para el resumen que ve el barbero antes de enviar la solicitud: el
  // cliente de una cita (selectedCustomer), el que eligió a mano en Items
  // (selectedBarberoCustomer), o el nombre que tipeó a mano si no está
  // registrado -- lo que haya, en ese orden.
  get clienteResumenSolicitud(): string {
    if (this.selectedCustomer) return `${this.selectedCustomer.nombre} ${this.selectedCustomer.apellido}`;
    if (this.selectedBarberoCustomer) return `${this.selectedBarberoCustomer.nombre} ${this.selectedBarberoCustomer.apellido}`;
    return this.clienteNoRegNombre;
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────
  // Barbero y cliente son ambos opcionales -- no toda venta la atiende un
  // barbero ni es de un cliente registrado (ej. alguien compra o consume
  // algo sin que sea por un servicio de barberia).
  goToItems(): void {
    this.step = 'items';
  }

  goToPayment(): void {
    if (!this.cartItems.length) {
      this.snackBar.open('Agrega al menos un ítem', '', { duration: 2000 });
      return;
    }
    this.step = 'payment';
    this.cargarLoyaltyPreview();
  }

  private cargarLoyaltyPreview(): void {
    this.loyaltyPreview = null;
    if (!this.selectedCustomer || this.esBarbero) return;
    const items = this.cartItems.map(i => ({ tipo: i.tipo, itemId: i.itemId, cantidad: i.cantidad }));
    this.loyaltyService.previewParaVenta(this.selectedCustomer.id, items).subscribe({
      next: p => (this.loyaltyPreview = p),
      error: () => {},
    });
  }

  confirmSale(): void {
    this.loading = true;
    const pagos: SalePago[] = this.splitMode
      ? this.payments.map(p => ({ metodoPago: p.metodo, monto: p.monto }))
      : [{ metodoPago: this.selectedPayment, monto: this.total }];
    const form = {
      // El cliente de una cita ya se sabe de antes (cargarDesdeCita lo puso
      // en selectedCustomer) -- se manda igual. Fuera de eso, el barbero
      // puede opcionalmente elegir un cliente ya registrado
      // (selectedBarberoCustomer); si no eligió ninguno, no manda nada --
      // recepcion lo asigna al aceptar y cobrar. El metodo de pago sigue
      // sin ser cosa del barbero.
      clienteId: (this.esBarbero && !this.citaId) ? this.selectedBarberoCustomer?.id : this.selectedCustomer?.id,
      barberoId: this.selectedWorker?.id,
      items: this.cartItems.map(({ tipo, itemId, nombre, precio, cantidad, subtotal }) =>
        ({ tipo, itemId, nombre, precio, cantidad, subtotal })),
      pagos: this.esBarbero ? undefined : pagos,
      descuento: this.discount,
      notas: this.notasClienteNoRegistrado,
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
    this.selectedCustomer = null;
    this.selectedBarberoCustomer = null;
    this.cartItems = [];
    this.discount  = 0;
    this.selectedPayment = 'EFECTIVO';
    this.montoRecibido = null;
    this.splitMode = false;
    this.payments = [];
    this.searchCustomer = '';
    this.cancelarClienteNoRegistrado();
    this.lastSaleId = null;
    this.lastSaleEstado = null;
    this.citaId = null;
    this.citaOrigen = null;
    this.loyaltyPreview = null;

    // Como ya estamos parados en /sales/quick, navegar a la misma ruta no
    // vuelve a correr ngOnInit -- por eso el barbero (a diferencia de
    // ADMIN/CASHIER/RECEPTION) necesita que su barbero propio se
    // re-derive aca mismo, igual que en ngOnInit, en vez de quedar en null
    // (lo que antes hacia aparecer "Tu usuario no esta vinculado a un
    // barbero" aunque si lo estuviera).
    if (this.esBarbero) {
      const miBarberoId = this.authService.currentUser?.barberoId;
      this.selectedWorker = this.workers.find(w => w.id === miBarberoId) ?? null;
      this.step = this.selectedWorker ? 'items' : 'setup';
    } else {
      this.selectedWorker = null;
      this.step = 'setup';
    }

    this.router.navigate(['/sales/quick']);
  }

  selectPayment(method: PaymentMethod): void {
    this.selectedPayment = method;
    this.montoRecibido = null;
  }

  // ─── Pago dividido ───────────────────────────────────────────────────────────
  enableSplit(): void {
    const segundo = this.paymentMethods.find(p => p.value !== this.selectedPayment)!.value;
    this.payments = [
      { metodo: this.selectedPayment, monto: this.total },
      { metodo: segundo, monto: 0 },
    ];
    this.splitMode = true;
    this.montoRecibido = null;
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
      // Vuelve al flujo simple, conservando el metodo de la fila que quedó.
      this.selectedPayment = this.payments[0]?.metodo ?? 'EFECTIVO';
      this.payments = [];
      this.splitMode = false;
      this.montoRecibido = null;
    }
  }

  get hayMetodosDisponibles(): boolean {
    return this.payments.length < this.paymentMethods.length;
  }

  // ─── Template helpers (evitan arrow functions en templates) ──────────────────
  getSelectedPaymentIcon(): string {
    return this.paymentMethods.find(p => p.value === this.selectedPayment)?.icon ?? 'payments';
  }

  getSelectedPaymentLabel(): string {
    return this.paymentMethods.find(p => p.value === this.selectedPayment)?.label ?? this.selectedPayment;
  }

  getPaymentLabel(metodo: PaymentMethod): string {
    return this.paymentMethods.find(p => p.value === metodo)?.label ?? metodo;
  }

  get paymentsSummaryText(): string {
    return this.payments.map(p => `${this.getPaymentLabel(p.metodo)} S/ ${p.monto.toFixed(2)}`).join(' + ');
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
