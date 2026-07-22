import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Subscription, interval, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Sale, SaleFilters } from '../../../core/models/sale.model';
import { SaleService } from '../../../data/repositories/sale.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ConfirmarVentaDialogComponent } from '../confirmar-venta-dialog/confirmar-venta-dialog.component';
import { EditarVentaDialogComponent } from '../editar-venta-dialog/editar-venta-dialog.component';
import { toLocalDateStr } from '../../../core/utils/date.util';

@Component({
  selector: 'app-sale-list',
  standalone: false,
  templateUrl: './sale-list.component.html',
})
export class SaleListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['id', 'fecha', 'clienteNombre', 'barberoNombre', 'tipoVenta', 'total', 'metodoPago', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Sale>([]);
  loading = true;

  // Por defecto se muestra solo el dia de hoy; null = "todas las fechas".
  fechaDesde: Date | null = new Date();
  fechaHasta: Date | null = new Date();

  // Si se llega desde la tarjeta "Solicitudes pendientes" del Dashboard, la
  // solicitud puede ser de un dia anterior -- no debe quedar oculta por el
  // filtro de fecha de hoy, asi que ese caso arranca sin filtro de fecha.
  mostrandoSoloPendientes = false;

  private estadoFiltro?: SaleFilters['estado'];
  private pollSub?: Subscription;

  constructor(
    private saleService: SaleService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
  ) {}

  get puedeCobrar(): boolean {
    return this.authService.hasRole(['ADMIN', 'CASHIER', 'RECEPTION']);
  }

  get puedeEditar(): boolean {
    return this.authService.hasRole(['ADMIN']);
  }

  private readonly metodoPagoLabels: Record<string, string> = {
    EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transferencia',
    YAPE: 'Yape', PLIN: 'Plin', MIXTO: 'Mixto',
  };

  metodoPagoLabel(sale: Sale): string {
    if (!sale.metodoPago) return 'Sin asignar';
    return this.metodoPagoLabels[sale.metodoPago] ?? sale.metodoPago;
  }

  // Para el tooltip cuando es Mixto -- el detalle de cuanto se pago con
  // cada metodo, no cabe en la celda de la tabla.
  metodoPagoDetalle(sale: Sale): string {
    if (!sale.pagos || sale.pagos.length <= 1) return '';
    return sale.pagos.map(p => `${this.metodoPagoLabels[p.metodoPago] ?? p.metodoPago}: S/ ${p.monto.toFixed(2)}`).join(' + ');
  }

  ngOnInit(): void {
    const estadoParam = this.route.snapshot.queryParamMap.get('estado');
    if (estadoParam === 'PENDIENTE') {
      this.mostrandoSoloPendientes = true;
      this.fechaDesde = null;
      this.fechaHasta = null;
      this.load({ estado: 'PENDIENTE' });
    } else if (estadoParam === 'COMPLETADA') {
      // Viene de la tarjeta "Clientes atendidos" del Dashboard -- esa
      // cuenta es de hoy, asi que el filtro de fecha se queda como esta
      // (por defecto ya es hoy) en vez de limpiarse como con PENDIENTE.
      this.load({ estado: 'COMPLETADA' });
    } else {
      this.load();
    }
    this.iniciarSondeo();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  load(overrides?: Pick<SaleFilters, 'estado'>): void {
    this.estadoFiltro = overrides?.estado;
    this.loading = true;
    this.saleService.search({
      fechaDesde: this.fechaDesde ? this.toIsoDate(this.fechaDesde) : undefined,
      fechaHasta: this.fechaHasta ? this.toIsoDate(this.fechaHasta) : undefined,
      ...overrides,
    }).subscribe({
      next: sales => {
        this.dataSource.data = sales;
        this.loading = false;
      },
      error: (err: Error) => { this.loading = false; this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }); },
    });
  }

  // Si un barbero agrega/quita items de una solicitud pendiente (o alguien
  // mas la cobra/anula) mientras esta pantalla sigue abierta, la lista
  // quedaria desactualizada hasta refrescar a mano -- con el riesgo de
  // cobrar de mas/de menos por estar mirando un total viejo. Se refresca
  // sola cada 30s (misma cadencia que el resto del sistema, ver
  // dashboard.component.ts) sin tocar "loading" para no tapar la tabla con
  // el spinner y cortar a alguien que esta mirando/clickeando en ese momento.
  private iniciarSondeo(): void {
    this.pollSub = interval(30000).pipe(
      switchMap(() => this.saleService.search({
        fechaDesde: this.fechaDesde ? this.toIsoDate(this.fechaDesde) : undefined,
        fechaHasta: this.fechaHasta ? this.toIsoDate(this.fechaHasta) : undefined,
        estado: this.estadoFiltro,
      }).pipe(catchError(() => of(null)))),
    ).subscribe(sales => {
      if (sales) this.dataSource.data = sales;
    });
  }

  onFiltersChange(): void {
    this.mostrandoSoloPendientes = false;
    this.load();
  }

  limpiarFiltroFecha(): void {
    this.fechaDesde = null;
    this.fechaHasta = null;
    this.mostrandoSoloPendientes = false;
    this.load();
  }

  hoyFiltro(): void {
    this.fechaDesde = new Date();
    this.fechaHasta = new Date();
    this.mostrandoSoloPendientes = false;
    this.load();
  }

  private toIsoDate(d: Date): string {
    return toLocalDateStr(d);
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  aceptarYCobrar(sale: Sale): void {
    const ref = this.dialog.open(ConfirmarVentaDialogComponent, { width: '480px', data: sale });
    ref.afterClosed().subscribe(updated => {
      if (updated) this.load(this.mostrandoSoloPendientes ? { estado: 'PENDIENTE' } : undefined);
    });
  }

  editarVenta(sale: Sale): void {
    const ref = this.dialog.open(EditarVentaDialogComponent, { width: '720px', maxHeight: '90vh', data: sale });
    ref.afterClosed().subscribe(updated => {
      if (updated) this.load(this.mostrandoSoloPendientes ? { estado: 'PENDIENTE' } : undefined);
    });
  }

  eliminarVenta(sale: Sale): void {
    if (!confirm(`¿Eliminar definitivamente la venta #${sale.id}${sale.clienteNombre ? ' de ' + sale.clienteNombre : ''}? Esto la borra por completo del sistema (no queda como anulada) y no se puede deshacer.`)) return;
    this.saleService.delete(sale.id).subscribe({
      next: () => {
        this.snackBar.open(`Venta #${sale.id} eliminada`, '', { duration: 3000, panelClass: 'success-snack' });
        this.load(this.mostrandoSoloPendientes ? { estado: 'PENDIENTE' } : undefined);
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
  }
}
