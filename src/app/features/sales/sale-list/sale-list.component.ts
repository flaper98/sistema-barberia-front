import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
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
export class SaleListComponent implements OnInit, AfterViewInit {
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
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  load(overrides?: Pick<SaleFilters, 'estado'>): void {
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
    const ref = this.dialog.open(EditarVentaDialogComponent, { width: '480px', data: sale });
    ref.afterClosed().subscribe(updated => {
      if (updated) this.load(this.mostrandoSoloPendientes ? { estado: 'PENDIENTE' } : undefined);
    });
  }
}
