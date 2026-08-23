import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Product } from '../../../core/models/product.model';
import { Worker } from '../../../core/models/worker.model';
import {
  CitaReporte,
  LoyaltyReporte,
  TopProductoReporte,
  TopServicioReporte,
  VentaPorBarbero,
  VentaReporte,
} from '../../../core/models/report.model';
import { FinanceEntry, FinanceSummary, FinanceType } from '../../../core/models/finance.model';
import { ReportService } from '../../../data/repositories/report.service';
import { ProductService } from '../../../data/repositories/product.service';
import { WorkerService } from '../../../data/repositories/worker.service';
import { FinanceService } from '../../../data/repositories/finance.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { toLocalDateStr } from '../../../core/utils/date.util';

type ReportWidget = 'ventasPorBarbero' | 'topServicios' | 'topProductos' | 'lowStock';

@Component({ selector: 'app-reports-dashboard', standalone: false, templateUrl: './reports-dashboard.component.html', styleUrls: ['./reports-dashboard.component.scss'] })
export class ReportsDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  readonly widgetPageSize = 5;
  widgetPages: Record<ReportWidget, number> = {
    ventasPorBarbero: 0, topServicios: 0, topProductos: 0, lowStock: 0,
  };

  loading = true;
  filtering = false;
  activeTab = 0;

  workers: Worker[] = [];
  barberoId: number | null = null;
  tipoFinanza: FinanceType | null = null;
  fechaDesde: Date = new Date();
  fechaHasta: Date = new Date();

  ventasColumns = ['id', 'fecha', 'clienteNombre', 'barberoNombre', 'metodoPago', 'total', 'estado'];
  ventasDataSource = new MatTableDataSource<VentaReporte>([]);
  ventas: VentaReporte[] = [];
  ventasPorBarbero: VentaPorBarbero[] = [];
  topServicios: TopServicioReporte[] = [];
  topProductos: TopProductoReporte[] = [];
  citas: CitaReporte[] = [];
  lowStock: Product[] = [];
  financeSummary: FinanceSummary | null = null;
  financeEntries: FinanceEntry[] = [];
  loyaltySummary: LoyaltyReporte | null = null;

  constructor(
    private reportService: ReportService,
    private productService: ProductService,
    private workerService: WorkerService,
    private financeService: FinanceService,
    private permissionService: PermissionService,
    private snackBar: MatSnackBar,
  ) {}

  get puedeVerFinanzas(): boolean {
    return this.permissionService.canView('FINANZAS');
  }

  ngAfterViewInit(): void {
    this.ventasDataSource.paginator = this.paginator;
  }

  ngOnInit(): void {
    const hoy = new Date();
    this.fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaHasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    this.workerService.getActive().subscribe({
      next: workers => { this.workers = workers; },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });

    forkJoin({
      lowStock: this.productService.getLowStock(),
      loyalty: this.reportService.getLoyaltySummary(),
    }).subscribe({
      next: ({ lowStock, loyalty }) => {
        this.lowStock = lowStock;
        this.loyaltySummary = loyalty;
        this.loadReports(true);
      },
      error: (err: Error) => {
        this.loading = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  onFiltersChange(): void {
    this.loadReports(false);
  }

  private loadReports(initial: boolean): void {
    if (initial) this.loading = true; else this.filtering = true;
    const desde = this.toIsoDate(this.fechaDesde);
    const hasta = this.toIsoDate(this.fechaHasta);

    // Finanzas es un modulo aparte (un barbero no tiene acceso) -- si esas dos
    // llamadas fallan por permisos, no deben tumbar el resto de las pestañas
    // (Ventas/Citas/Fidelización), que si le corresponden.
    const financeSummary$ = this.puedeVerFinanzas
      ? this.reportService.getFinanceSummary(desde, hasta).pipe(catchError(() => of(null as FinanceSummary | null)))
      : of(null as FinanceSummary | null);
    const financeEntries$ = this.puedeVerFinanzas
      ? this.financeService.search({
          fechaDesde: desde,
          fechaHasta: hasta,
          tipo: this.tipoFinanza ?? undefined,
        }).pipe(catchError(() => of([] as FinanceEntry[])))
      : of([] as FinanceEntry[]);

    forkJoin({
      ventas: this.reportService.getSales(desde, hasta, 'COMPLETADA', this.barberoId),
      ventasPorBarbero: this.reportService.getSalesByWorker(desde, hasta, this.barberoId),
      topServicios: this.reportService.getTopServices(desde, hasta, 10, this.barberoId),
      topProductos: this.reportService.getTopProducts(desde, hasta, 10, this.barberoId),
      citas: this.reportService.getAppointments(desde, hasta, undefined, this.barberoId),
      financeSummary: financeSummary$,
      financeEntries: financeEntries$,
    }).subscribe({
      next: ({ ventas, ventasPorBarbero, topServicios, topProductos, citas, financeSummary, financeEntries }) => {
        this.ventas = ventas;
        this.ventasDataSource.data = ventas;
        if (this.ventasDataSource.paginator) this.ventasDataSource.paginator.firstPage();
        this.ventasPorBarbero = ventasPorBarbero.filter(v => v.totalVentas > 0);
        this.topServicios = topServicios;
        this.topProductos = topProductos;
        this.citas = citas;
        this.widgetPages = { ventasPorBarbero: 0, topServicios: 0, topProductos: 0, lowStock: this.widgetPages.lowStock };
        this.financeSummary = financeSummary;
        this.financeEntries = financeEntries;
        this.loading = false;
        this.filtering = false;
      },
      error: (err: Error) => {
        this.loading = false;
        this.filtering = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  private toIsoDate(d: Date): string {
    return toLocalDateStr(d);
  }

  get totalVentas(): number { return this.ventas.length; }
  get totalIngresos(): number { return this.ventas.reduce((a, v) => a + v.total, 0); }
  get citasAtendidas(): number { return this.citas.filter(c => c.estado === 'ATENDIDA').length; }
  get citasCanceladas(): number { return this.citas.filter(c => c.estado === 'CANCELADA' || c.estado === 'NO_ASISTIO').length; }

  // ─── Paginación (5 por página) de los widgets de reportes ─────────────────────
  get pagedVentasPorBarbero(): VentaPorBarbero[] { return this.paginarWidget(this.ventasPorBarbero, 'ventasPorBarbero'); }
  get pagedTopServicios(): TopServicioReporte[] { return this.paginarWidget(this.topServicios, 'topServicios'); }
  get pagedTopProductos(): TopProductoReporte[] { return this.paginarWidget(this.topProductos, 'topProductos'); }
  get pagedLowStock(): Product[] { return this.paginarWidget(this.lowStock, 'lowStock'); }

  totalPaginasWidget(widget: ReportWidget): number {
    const cantidad = { ventasPorBarbero: this.ventasPorBarbero.length, topServicios: this.topServicios.length, topProductos: this.topProductos.length, lowStock: this.lowStock.length }[widget];
    return Math.max(1, Math.ceil(cantidad / this.widgetPageSize));
  }

  rankDeWidget(widget: ReportWidget, index: number): number {
    return this.widgetPages[widget] * this.widgetPageSize + index + 1;
  }

  cambiarPaginaWidget(widget: ReportWidget, delta: number): void {
    const nueva = Math.min(Math.max(0, this.widgetPages[widget] + delta), this.totalPaginasWidget(widget) - 1);
    this.widgetPages[widget] = nueva;
  }

  private paginarWidget<T>(items: T[], widget: ReportWidget): T[] {
    const start = this.widgetPages[widget] * this.widgetPageSize;
    return items.slice(start, start + this.widgetPageSize);
  }

  exportar(): void {
    const rango = `${this.toIsoDate(this.fechaDesde)}_a_${this.toIsoDate(this.fechaHasta)}`;

    if (this.activeTab === 0) {
      this.descargarCsv(`ventas_${rango}.csv`,
        ['ID', 'Fecha', 'Cliente', 'Barbero', 'Subtotal', 'Descuento', 'Total', 'Método de pago', 'Estado', 'Items'],
        this.ventas.map(v => [v.id, v.fecha, v.clienteNombre ?? '', v.barberoNombre ?? '', v.subtotal, v.descuento, v.total, v.metodoPago, v.estado, v.itemsCount]));
    } else if (this.activeTab === 1) {
      this.descargarCsv(`citas_${rango}.csv`,
        ['ID', 'Fecha', 'Hora', 'Cliente', 'Barbero', 'Estado', 'Total estimado', 'Servicios'],
        this.citas.map(c => [c.id, c.fecha, c.hora, c.clienteNombre, c.barberoNombre, c.estado, c.totalEstimado, c.serviciosCount]));
    } else if (this.activeTab === 2) {
      this.descargarCsv(`movimientos_financieros_${rango}.csv`,
        ['ID', 'Tipo', 'Categoría', 'Descripción', 'Monto', 'Fecha', 'Usuario'],
        this.financeEntries.map(e => [e.id, e.tipo, e.categoria, e.descripcion, e.monto, e.fecha, e.usuarioNombre]));
    } else if (this.activeTab === 3 && this.loyaltySummary) {
      this.descargarCsv(`fidelizacion_${rango}.csv`,
        ['Clientes con cuenta', 'Con recompensas', 'Sellos otorgados', 'Recompensas canjeadas', 'Recompensas pendientes'],
        [[
          this.loyaltySummary.totalClientesConCuenta,
          this.loyaltySummary.clientesConRecompensas,
          this.loyaltySummary.totalSellosOtorgados,
          this.loyaltySummary.totalRecompensasCanjeadas,
          this.loyaltySummary.totalRecompensasPendientes,
        ]]);
    }
  }

  private descargarCsv(filename: string, headers: string[], rows: (string | number | null)[][]): void {
    const csv = [headers, ...rows]
      .map(row => row.map(cell => this.escaparCeldaCsv(cell)).join(','))
      .join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private escaparCeldaCsv(value: string | number | null): string {
    const str = String(value ?? '');
    return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }
}
