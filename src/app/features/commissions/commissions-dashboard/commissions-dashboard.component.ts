import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { CommissionService } from '../../../data/repositories/commission.service';
import { WorkerService } from '../../../data/repositories/worker.service';
import { WorkerSelector } from '../../../core/models/worker.model';
import { ResumenComision, CorteComision, TasaComision, DetalleComision } from '../../../core/models/commission.model';
import { toLocalDateStr } from '../../../core/utils/date.util';
import { matchesSearch } from '../../../core/utils/search.util';
import { RegistrarPropinaDialogComponent } from '../registrar-propina-dialog/registrar-propina-dialog.component';
import { RegistrarDescuentoDialogComponent } from '../registrar-descuento-dialog/registrar-descuento-dialog.component';

// Los barberos cobran por comision (servicios + productos, con tasas
// distintas), mas propinas, menos descuentos por consumo. Esta pantalla
// se adapta segun el rol: ADMIN/CASHIER/RECEPTION eligen cualquier
// barbero y pueden registrar propinas/descuentos y generar/pagar cortes;
// BARBER solo ve su propio resumen e historial, de forma informativa.
@Component({
  selector: 'app-commissions-dashboard',
  standalone: false,
  templateUrl: './commissions-dashboard.component.html',
  styleUrls: ['./commissions-dashboard.component.scss'],
})
export class CommissionsDashboardComponent implements OnInit {
  esBarbero = false;
  puedeEditar = false;
  sinBarberoVinculado = false;

  workers: WorkerSelector[] = [];
  selectedWorkerId: number | null = null;

  fechaDesde: Date;
  fechaHasta: Date;

  resumen: ResumenComision | null = null;
  cortes: CorteComision[] = [];
  loadingResumen = false;
  loadingCortes = false;
  generandoCorte = false;

  // El detalle por item es mas sensible que el resumen general -- un
  // barbero siempre puede ver el suyo, ADMIN siempre puede, pero CASHIER/
  // RECEPTION necesitan el permiso explicito "Ver detalle" (ver Usuarios ->
  // Roles y permisos). El backend ya lo exige aparte (ver ComisionController),
  // esto es solo para no mostrar el botón si de todas formas va a dar 403.
  puedeVerDetalle = false;

  // Detalle "por item" (cuanto de CADA servicio/producto/paquete) -- se
  // pide recien al abrir el desplegable, no de una, porque no todos lo
  // necesitan ver siempre.
  detalle: DetalleComision[] = [];
  mostrarDetalle = false;
  loadingDetalle = false;
  detalleCargado = false;

  tasasServicios: TasaComision[] = [];
  tasasProductos: TasaComision[] = [];
  tasasPaquetes: TasaComision[] = [];
  loadingTasas = false;
  tasasCargadas = false;

  filtroServicios = '';
  filtroProductos = '';
  filtroPaquetes = '';

  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
    private commissionService: CommissionService,
    private workerService: WorkerService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {
    const hoy = new Date();
    this.fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaHasta = hoy;
  }

  ngOnInit(): void {
    this.esBarbero = this.authService.hasRole(['BARBER']);
    this.puedeEditar = !this.esBarbero &&
      (this.authService.hasRole(['ADMIN']) || this.permissionService.canEdit('COMISIONES'));
    this.puedeVerDetalle = this.esBarbero || this.authService.hasRole(['ADMIN']) ||
      this.permissionService.canViewDetail('COMISIONES');

    if (this.esBarbero) {
      const miBarberoId = this.authService.currentUser?.barberoId;
      if (!miBarberoId) {
        this.sinBarberoVinculado = true;
        return;
      }
      this.selectedWorkerId = miBarberoId;
      this.cargarTodo();
    } else {
      this.workerService.getForSale().subscribe({
        next: workers => {
          this.workers = workers;
          if (workers.length) {
            this.selectedWorkerId = workers[0].id;
            this.cargarTodo();
          }
        },
        error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
      });
    }
  }

  get workerNombre(): string {
    return this.resumen?.barberoNombre
      ?? this.workers.find(w => w.id === this.selectedWorkerId)?.nombre
      ?? '';
  }

  onWorkerChange(): void {
    this.cargarTodo();
  }

  onFechaChange(): void {
    this.cargarTodo();
  }

  private cargarTodo(): void {
    this.cargarResumen();
    this.cargarCortes();
    // Cambio de barbero/fechas invalida el detalle ya cargado -- se vuelve
    // a pedir recien si lo abren de nuevo, para no mostrar datos viejos.
    this.detalle = [];
    this.detalleCargado = false;
    this.mostrarDetalle = false;
  }

  cargarResumen(): void {
    if (!this.selectedWorkerId) return;
    this.loadingResumen = true;
    this.commissionService.getResumen(this.selectedWorkerId, toLocalDateStr(this.fechaDesde), toLocalDateStr(this.fechaHasta)).subscribe({
      next: r => { this.resumen = r; this.loadingResumen = false; },
      error: (err: Error) => { this.loadingResumen = false; this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }); },
    });
  }

  cargarCortes(): void {
    if (!this.selectedWorkerId) return;
    this.loadingCortes = true;
    this.commissionService.getCortes(this.selectedWorkerId).subscribe({
      next: cortes => { this.cortes = cortes; this.loadingCortes = false; },
      error: (err: Error) => { this.loadingCortes = false; this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }); },
    });
  }

  toggleDetalle(): void {
    this.mostrarDetalle = !this.mostrarDetalle;
    if (this.mostrarDetalle && !this.detalleCargado) {
      this.cargarDetalle();
    }
  }

  private cargarDetalle(): void {
    if (!this.selectedWorkerId) return;
    this.loadingDetalle = true;
    this.detalleCargado = true;
    this.commissionService.getResumenDetalle(this.selectedWorkerId, toLocalDateStr(this.fechaDesde), toLocalDateStr(this.fechaHasta)).subscribe({
      next: d => { this.detalle = d; this.loadingDetalle = false; },
      error: (err: Error) => { this.loadingDetalle = false; this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }); },
    });
  }

  get detalleServicios(): DetalleComision[] {
    return this.detalle.filter(d => d.tipo === 'SERVICIO' || d.tipo === 'PAQUETE');
  }

  get detalleProductos(): DetalleComision[] {
    return this.detalle.filter(d => d.tipo === 'PRODUCTO');
  }

  abrirPropina(): void {
    if (!this.selectedWorkerId) return;
    const ref = this.dialog.open(RegistrarPropinaDialogComponent, {
      width: '420px',
      data: { barberoId: this.selectedWorkerId, barberoNombre: this.workerNombre },
    });
    ref.afterClosed().subscribe(ok => { if (ok) this.cargarResumen(); });
  }

  abrirConsumo(): void {
    if (!this.selectedWorkerId) return;
    const ref = this.dialog.open(RegistrarDescuentoDialogComponent, {
      width: '460px',
      data: { barberoId: this.selectedWorkerId, barberoNombre: this.workerNombre },
    });
    ref.afterClosed().subscribe(ok => { if (ok) this.cargarResumen(); });
  }

  generarCorte(): void {
    if (!this.selectedWorkerId || !this.resumen) return;
    const desde = toLocalDateStr(this.fechaDesde);
    const hasta = toLocalDateStr(this.fechaHasta);
    if (!confirm(`¿Generar el corte del ${desde} al ${hasta} por S/ ${this.resumen.totalEstimado.toFixed(2)}? Esto agrupa las propinas/descuentos de ese rango -- no se puede deshacer.`)) return;

    this.generandoCorte = true;
    this.commissionService.generarCorte({ barberoId: this.selectedWorkerId, fechaDesde: desde, fechaHasta: hasta }).subscribe({
      next: () => {
        this.generandoCorte = false;
        this.snackBar.open('Corte generado', '', { duration: 2500, panelClass: 'success-snack' });
        this.cargarTodo();
      },
      error: (err: Error) => {
        this.generandoCorte = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  marcarPagado(corte: CorteComision): void {
    if (!confirm(`¿Marcar este corte (S/ ${corte.totalAPagar.toFixed(2)}) como pagado? Esto genera un egreso en Finanzas y no se puede deshacer.`)) return;
    this.commissionService.marcarComoPagado(corte.id).subscribe({
      next: () => {
        this.snackBar.open('Corte marcado como pagado', '', { duration: 2500, panelClass: 'success-snack' });
        this.cargarCortes();
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
  }

  // La tasa se carga recien al entrar a la pestaña "Tasas de comisión"
  // (no en ngOnInit) porque solo ADMIN/CASHIER/RECEPTION la usan.
  onTabChange(index: number): void {
    if (index === 1 && !this.tasasCargadas) {
      this.cargarTasas();
    }
  }

  private cargarTasas(): void {
    this.loadingTasas = true;
    this.tasasCargadas = true;
    this.commissionService.getTasasServicios().subscribe(t => this.tasasServicios = t);
    this.commissionService.getTasasProductos().subscribe(t => this.tasasProductos = t);
    this.commissionService.getTasasPaquetes().subscribe({
      next: t => { this.tasasPaquetes = t; this.loadingTasas = false; },
      error: (err: Error) => { this.loadingTasas = false; this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }); },
    });
  }

  get tasasServiciosFiltradas(): TasaComision[] {
    return this.tasasServicios.filter(t => matchesSearch(this.filtroServicios, t.nombre));
  }

  get tasasProductosFiltradas(): TasaComision[] {
    return this.tasasProductos.filter(t => matchesSearch(this.filtroProductos, t.nombre));
  }

  get tasasPaquetesFiltradas(): TasaComision[] {
    return this.tasasPaquetes.filter(t => matchesSearch(this.filtroPaquetes, t.nombre));
  }

  guardarTasa(tipo: 'SERVICIO' | 'PRODUCTO' | 'PAQUETE', item: TasaComision): void {
    const pct = Number(item.porcentajeComision);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      this.snackBar.open('El porcentaje debe estar entre 0 y 100', 'Cerrar', { duration: 3000 });
      return;
    }
    const op$ = tipo === 'SERVICIO' ? this.commissionService.actualizarTasaServicio(item.id, pct)
      : tipo === 'PRODUCTO' ? this.commissionService.actualizarTasaProducto(item.id, pct)
      : this.commissionService.actualizarTasaPaquete(item.id, pct);
    op$.subscribe({
      next: () => this.snackBar.open(`${item.nombre}: comisión actualizada a ${pct}%`, '', { duration: 2000, panelClass: 'success-snack' }),
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
  }
}
