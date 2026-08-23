import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Sale, SaleItem, PaymentMethod, SalePago } from '../../../core/models/sale.model';
import { Customer } from '../../../core/models/customer.model';
import { BarberService } from '../../../core/models/service.model';
import { Product } from '../../../core/models/product.model';
import { Paquete } from '../../../core/models/paquete.model';
import { SaleService } from '../../../data/repositories/sale.service';
import { CustomerService } from '../../../data/repositories/customer.service';
import { BusinessConfigService } from '../../../data/repositories/business-config.service';
import { LoyaltyService } from '../../../data/repositories/loyalty.service';
import { LoyaltyPreview } from '../../../core/models/loyalty.model';
import { BusinessConfig, DEFAULT_BUSINESS_CONFIG } from '../../../core/models/business-config.model';
import { buildWhatsappLink } from '../../../core/utils/whatsapp.util';
import { formatCodigo } from '../../../core/utils/format.util';
import { matchesSearch } from '../../../core/utils/search.util';
import { ServiceCatalogService } from '../../../data/repositories/service-catalog.service';
import { ProductService } from '../../../data/repositories/product.service';
import { PaqueteService } from '../../../data/repositories/paquete.service';

interface ItemParaAgregar {
  tipo: 'SERVICIO' | 'PRODUCTO' | 'PAQUETE';
  itemId: number;
  nombre: string;
  precio: number;
}

@Component({
  selector: 'app-confirmar-venta-dialog',
  standalone: false,
  templateUrl: './confirmar-venta-dialog.component.html',
  styleUrls: ['./confirmar-venta-dialog.component.scss'],
})
export class ConfirmarVentaDialogComponent implements OnInit {
  saving = false;
  // La lista que abre este dialogo puede tener hasta 30s de antiguedad (ver
  // sondeo en sale-list.component.ts), y el barbero puede haber agregado
  // items a la solicitud recien. Mostrar esos items/total viejos aca seria
  // el peor lugar posible para estar desactualizado: recepcion cobraria
  // literalmente el monto equivocado. Por eso este dialogo NUNCA confia en
  // los datos con los que se abrio -- vuelve a pedir la venta fresca antes
  // de mostrar nada (ver ngOnInit), y solo despues de eso queda usable.
  loading = true;
  metodoPago: PaymentMethod | null = null;

  // Pago dividido en mas de un metodo (ej. mitad efectivo, mitad Yape) --
  // ver el mismo patron en quick-sale.component.ts.
  splitMode = false;
  payments: { metodo: PaymentMethod; monto: number }[] = [];

  // La solicitud puede llegar sin cliente (el barbero no lo elige) --
  // recepcion lo asigna aca antes de cobrar.
  customers: Customer[] = [];
  searchCustomer = '';
  selectedCustomer: Customer | null = null;
  private searchCustomerChanged = new Subject<string>();

  // Alta rapida de cliente sin salir del dialogo -- para cuando quien viene
  // a pagar todavia no esta registrado.
  showNewCustomerForm = false;
  creatingCustomer = false;
  newCustomerForm: FormGroup;
  proximoCodigo: string | null = null;
  // Para poder ofrecer el mensaje de bienvenida por WhatsApp solo del
  // cliente que se acaba de crear aca (no de uno ya existente que recepcion
  // elija despues) -- ver crearCliente() y toggleCustomer().
  clienteRecienCreadoId: number | null = null;
  private business: BusinessConfig = DEFAULT_BUSINESS_CONFIG;

  // Aviso ANTES de cobrar: si con esta venta el cliente completa (una o mas
  // veces) su sello de fidelizacion -- ver LoyaltyService.previewParaVenta.
  loyaltyPreview: LoyaltyPreview | null = null;

  // Agregar/quitar productos o servicios sin salir de este dialogo (antes
  // habia que cancelar e ir a "Editar" la venta, aparte). Cada cambio se
  // sincroniza al toque contra el backend (ver sincronizarItems) para que
  // el total y el aviso de fidelizacion de arriba nunca queden atrasados.
  savingItems = false;
  mostrarAgregarItem = false;
  searchAgregarItem = '';
  private services: BarberService[] = [];
  private products: Product[] = [];
  private packages: Paquete[] = [];

  readonly paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'EFECTIVO',      label: 'Efectivo',      icon: 'payments' },
    { value: 'TARJETA',       label: 'Tarjeta',       icon: 'credit_card' },
    { value: 'YAPE',          label: 'Yape',          icon: 'phone_android' },
    { value: 'PLIN',          label: 'Plin',          icon: 'phone_iphone' },
    { value: 'TRANSFERENCIA', label: 'Transferencia', icon: 'account_balance' },
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public sale: Sale,
    private dialogRef: MatDialogRef<ConfirmarVentaDialogComponent>,
    private saleService: SaleService,
    private customerService: CustomerService,
    private businessConfigService: BusinessConfigService,
    private loyaltyService: LoyaltyService,
    private serviceCatalog: ServiceCatalogService,
    private productService: ProductService,
    private paqueteService: PaqueteService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
  ) {
    this.newCustomerForm = this.fb.group({
      nombre:   ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{7,20}$/)]],
    });
    this.businessConfigService.obtener().subscribe(cfg => (this.business = cfg));

    this.searchCustomerChanged.pipe(debounceTime(300), distinctUntilChanged()).subscribe(term => {
      this.customerService.search({ search: term || undefined, size: 20 }).subscribe({
        next: customers => (this.customers = customers),
        error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
      });
    });

    forkJoin({
      services: this.serviceCatalog.getActive(),
      products: this.productService.getAll(),
      packages: this.paqueteService.getActivos(),
    }).subscribe(({ services, products, packages }) => {
      this.services = services;
      this.products = products.filter(p => p.estado && p.stockActual > 0);
      this.packages = packages;
    });
  }

  ngOnInit(): void {
    this.saleService.getById(this.sale.id).subscribe({
      next: fresh => {
        this.sale = fresh;

        if (fresh.estado !== 'PENDIENTE') {
          this.snackBar.open(
            'Esta solicitud ya no está pendiente de cobro (alguien más ya la cobró, o cambió mientras tanto) -- se cerró para no cobrar mal.',
            'Cerrar', { duration: 6000 },
          );
          this.dialogRef.close(null);
          return;
        }

        this.loading = false;
        this.cargarCliente();
      },
      error: (err: Error) => {
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
        this.dialogRef.close(null);
      },
    });
  }

  private cargarCliente(): void {
    if (this.sale.clienteId) {
      this.customerService.getById(this.sale.clienteId).subscribe({
        next: c => { this.selectedCustomer = c; this.cargarLoyaltyPreview(); },
        error: () => {},
      });
    } else {
      // Si el barbero dejó datos de un cliente sin registrar (ver
      // quick-sale.component), precargamos el nombre en el buscador --
      // si no aparece nadie, "Nuevo cliente" ya lo va a tomar de ahí.
      const datos = this.datosClienteNuevo();
      if (datos) this.searchCustomer = datos.nombre;
      this.customerService.search({ search: this.searchCustomer || undefined, size: 20 }).subscribe({
        next: customers => (this.customers = customers),
        error: () => {},
      });
    }
  }

  // Formato armado en quick-sale.component.ts (notasClienteNoRegistrado).
  // Si en algun momento cambia ese formato, esto queda simplemente sin
  // matchear y no precarga nada -- no rompe el flujo normal.
  datosClienteNuevo(): { nombre: string; telefono: string } | null {
    if (!this.sale.notas) return null;
    const match = this.sale.notas.match(/^Cliente nuevo \(sin registrar\): (.+?)(?: - Tel: (\d+))?$/);
    if (!match) return null;
    return { nombre: match[1].trim(), telefono: match[2] ?? '' };
  }

  onSearchCustomerChange(): void {
    this.searchCustomerChanged.next(this.searchCustomer);
  }

  toggleCustomer(c: Customer): void {
    this.selectedCustomer = this.selectedCustomer?.id === c.id ? null : c;
    this.clienteRecienCreadoId = null;
    this.cargarLoyaltyPreview();
  }

  private cargarLoyaltyPreview(): void {
    this.loyaltyPreview = null;
    if (!this.selectedCustomer) return;
    const items = this.sale.items.map(i => ({ tipo: i.tipo, itemId: i.itemId, cantidad: i.cantidad }));
    this.loyaltyService.previewParaVenta(this.selectedCustomer.id, items).subscribe({
      next: p => (this.loyaltyPreview = p),
      error: () => {},
    });
  }

  // ─── Editar items sin salir del dialogo ────────────────────────────────────
  toggleAgregarItem(): void {
    this.mostrarAgregarItem = !this.mostrarAgregarItem;
    this.searchAgregarItem = '';
  }

  get resultadosAgregarItem(): ItemParaAgregar[] {
    if (!this.searchAgregarItem.trim()) return [];
    const catalogo: ItemParaAgregar[] = [
      ...this.services.map(s => ({ tipo: 'SERVICIO' as const, itemId: s.id, nombre: s.nombre, precio: s.precio })),
      ...this.products.map(p => ({ tipo: 'PRODUCTO' as const, itemId: p.id, nombre: p.nombre, precio: p.precioVenta })),
      ...this.packages.map(pk => ({ tipo: 'PAQUETE' as const, itemId: pk.id, nombre: pk.nombre, precio: pk.precio })),
    ];
    return catalogo.filter(r => matchesSearch(this.searchAgregarItem, r.nombre)).slice(0, 8);
  }

  agregarItem(item: ItemParaAgregar): void {
    const items = this.sale.items.map(i => ({ ...i }));
    const existente = items.find(i => i.tipo === item.tipo && i.itemId === item.itemId);
    if (existente) {
      existente.cantidad += 1;
      existente.subtotal = existente.precio * existente.cantidad;
    } else {
      items.push({ tipo: item.tipo, itemId: item.itemId, nombre: item.nombre, precio: item.precio, cantidad: 1, subtotal: item.precio });
    }
    this.sincronizarItems(items);
    this.searchAgregarItem = '';
  }

  cambiarCantidadItem(item: SaleItem, delta: number): void {
    const nuevaCantidad = item.cantidad + delta;
    if (nuevaCantidad < 1) { this.quitarItem(item); return; }
    const items = this.sale.items.map(i => i === item ? { ...i, cantidad: nuevaCantidad, subtotal: i.precio * nuevaCantidad } : i);
    this.sincronizarItems(items);
  }

  quitarItem(item: SaleItem): void {
    const restantes = this.sale.items.filter(i => i !== item);
    if (!restantes.length) {
      this.snackBar.open('La venta debe tener al menos un ítem', '', { duration: 2500 });
      return;
    }
    this.sincronizarItems(restantes);
  }

  private sincronizarItems(items: SaleItem[]): void {
    this.savingItems = true;
    this.saleService.updateItems(this.sale.id, items.map(({ tipo, itemId, nombre, precio, cantidad }) =>
      ({ tipo, itemId, nombre, precio, cantidad }))).subscribe({
      next: updated => {
        this.sale = updated;
        this.savingItems = false;
        // El total puede haber cambiado -- un pago dividido que ya estaba
        // armado quedaria desactualizado, se resetea para no cobrar un
        // monto viejo.
        this.splitMode = false;
        this.payments = [];
        this.metodoPago = null;
        this.cargarLoyaltyPreview();
      },
      error: (err: Error) => {
        this.savingItems = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  abrirNuevoCliente(): void {
    // Precarga el nombre con lo que ya se escribió en la búsqueda -- si
    // recepción tipeó "Juan Pérez" y no apareció nadie, no tiene que
    // volver a escribirlo.
    const partes = this.searchCustomer.trim().split(/\s+/);
    if (partes.length && partes[0]) {
      this.newCustomerForm.patchValue({
        nombre: partes[0],
        apellido: partes.slice(1).join(' '),
      });
    }
    // Si el telefono vino de los datos que dejó el barbero, tambien se
    // precarga -- asi recepcion no tiene que volver a pedirselo al cliente.
    const datos = this.datosClienteNuevo();
    if (datos?.telefono) {
      this.newCustomerForm.patchValue({ telefono: datos.telefono });
    }
    this.showNewCustomerForm = true;
    this.customerService.getNextCode().subscribe({
      next: id => (this.proximoCodigo = id != null ? formatCodigo(id) : null),
      error: () => (this.proximoCodigo = null),
    });
  }

  soloNumeros(event: Event): void {
    const input = event.target as HTMLInputElement;
    const limpio = input.value.replace(/\D/g, '');
    if (limpio !== input.value) {
      this.newCustomerForm.get('telefono')?.setValue(limpio);
    }
  }

  cancelarNuevoCliente(): void {
    this.showNewCustomerForm = false;
    this.newCustomerForm.reset();
    this.proximoCodigo = null;
  }

  crearCliente(): void {
    if (this.newCustomerForm.invalid) {
      this.newCustomerForm.markAllAsTouched();
      return;
    }
    this.creatingCustomer = true;
    const v = this.newCustomerForm.value;
    this.customerService.create({
      nombre: v.nombre,
      apellido: v.apellido,
      telefono: v.telefono,
      // Sin correo: a proposito no se manda '' -- ver comentario en
      // Customer.correo (choca contra el UNIQUE de la columna en la base).
      estado: true,
    }).subscribe({
      next: (nuevo) => {
        this.creatingCustomer = false;
        this.selectedCustomer = nuevo;
        this.clienteRecienCreadoId = nuevo.id;
        this.cargarLoyaltyPreview();
        this.showNewCustomerForm = false;
        this.newCustomerForm.reset();
        this.proximoCodigo = null;
        this.snackBar.open(`Cliente ${nuevo.nombre} ${nuevo.apellido} creado y seleccionado`, '', { duration: 2500, panelClass: 'success-snack' });
      },
      error: (err: Error) => {
        this.creatingCustomer = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  enviarBienvenidaWhatsapp(): void {
    if (!this.selectedCustomer) return;
    window.open(
      buildWhatsappLink(this.selectedCustomer, this.business.nombre, this.business.mensajeBienvenidaWhatsapp),
      '_blank',
    );
  }

  // ─── Pago dividido ───────────────────────────────────────────────────────────
  enableSplit(): void {
    const base = this.metodoPago ?? 'EFECTIVO';
    const segundo = this.paymentMethods.find(p => p.value !== base)!.value;
    this.payments = [
      { metodo: base, monto: this.sale.total },
      { metodo: segundo, monto: 0 },
    ];
    this.splitMode = true;
  }

  addPaymentRow(): void {
    const usados = new Set(this.payments.map(p => p.metodo));
    const disponible = this.paymentMethods.find(p => !usados.has(p.value));
    if (!disponible) return;
    const restante = Math.max(0, this.sale.total - this.paymentsSum);
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
    return Math.abs(this.paymentsSum - this.sale.total) > 0.005;
  }

  get paymentsDiffLabel(): string {
    const diff = this.sale.total - this.paymentsSum;
    return diff > 0 ? `Falta S/ ${diff.toFixed(2)}` : `Sobra S/ ${Math.abs(diff).toFixed(2)}`;
  }

  getPaymentLabel(metodo: PaymentMethod): string {
    return this.paymentMethods.find(p => p.value === metodo)?.label ?? metodo;
  }

  // El cliente es opcional -- no todo el que viene a pagar esta registrado.
  get puedeConfirmar(): boolean {
    if (this.loading || this.saving || this.savingItems) return false;
    if (this.splitMode) return this.payments.length >= 2 && !this.paymentsMismatch;
    return !!this.metodoPago;
  }

  confirmar(): void {
    if (!this.puedeConfirmar) return;
    const pagos: SalePago[] = this.splitMode
      ? this.payments.map(p => ({ metodoPago: p.metodo, monto: p.monto }))
      : [{ metodoPago: this.metodoPago!, monto: this.sale.total }];
    this.saving = true;
    this.saleService.confirm(this.sale.id, pagos, this.selectedCustomer?.id).subscribe({
      next: (updated) => {
        this.snackBar.open(`Venta #${updated.id} cobrada correctamente`, '', { duration: 3000, panelClass: 'success-snack' });
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
