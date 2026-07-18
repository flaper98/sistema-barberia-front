import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DashboardStats, DashboardChartData } from '../../core/models/dashboard.model';
import { DashboardService } from '../../data/repositories/dashboard.service';
import { AppointmentService } from '../../data/repositories/appointment.service';
import { ProductService } from '../../data/repositories/product.service';
import { Appointment } from '../../core/models/appointment.model';
import { Product } from '../../core/models/product.model';
import { AuthService } from '../../core/auth/auth.service';
import { PermissionService } from '../../core/auth/permission.service';
import { SaleService } from '../../data/repositories/sale.service';
import { toLocalDateStr } from '../../core/utils/date.util';

const PRIORIDAD_ESTADO: Record<string, number> = {
  PENDIENTE: 0,
  CONFIRMADA: 1,
  ATENDIDA: 2,
  NO_ASISTIO: 3,
  CANCELADA: 4,
};

type Widget = 'appointments' | 'services' | 'lowStock';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  chartData: DashboardChartData | null = null;
  todayAppointments: Appointment[] = [];
  lowStockProducts: Product[] = [];
  pendingSalesCount = 0;
  loading = true;

  readonly pageSize = 5;
  appointmentsPage = 0;
  servicesPage = 0;
  lowStockPage = 0;

  readonly today = new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  constructor(
    private dashboardService: DashboardService,
    private appointmentService: AppointmentService,
    private productService: ProductService,
    private saleService: SaleService,
    public authService: AuthService,
    private permissionService: PermissionService,
  ) {}

  get puedeVerAlertasNegocio(): boolean {
    return this.authService.hasRole(['ADMIN']) || this.permissionService.canEdit('DASHBOARD');
  }

  get puedeVerSolicitudesPendientes(): boolean {
    return this.authService.hasRole(['ADMIN']) || this.permissionService.canEdit('VENTAS');
  }

  // El historial de ventas (VentaController.listar) es un piso duro del
  // backend (ADMIN/CASHIER/RECEPTION), no configurable por la matriz de
  // permisos -- a diferencia de canEdit('VENTAS'), que el barbero sí tiene
  // (para poder crear sus solicitudes de cobro). Si se linkeara con ese
  // permiso, el barbero llegaría a /sales/list y se encontraría con un
  // "Access Denied" en vez de la lista.
  get puedeVerHistorialVentas(): boolean {
    return this.authService.hasRole(['ADMIN', 'CASHIER', 'RECEPTION']);
  }

  ngOnInit(): void {
    const todayStr = toLocalDateStr(new Date());

    const defaultStats: DashboardStats = {
      ventasHoy: 0, ingresosHoy: 0, citasHoy: 0, clientesAtendidos: 0,
      productosStockBajo: 0, barberoTopNombre: '-', barberoTopMonto: 0, recompensasPendientes: 0,
    };
    const defaultChart: DashboardChartData = {
      serviciosMasVendidos: [],
    };

    forkJoin({
      stats:    this.dashboardService.getStats().pipe(catchError(() => of(defaultStats))),
      chart:    this.dashboardService.getChartData().pipe(catchError(() => of(defaultChart))),
      appts:    this.appointmentService.getByDate(todayStr).pipe(catchError(() => of([] as Appointment[]))),
      lowStock: this.productService.getLowStock().pipe(catchError(() => of([] as Product[]))),
      pendingSales: this.puedeVerSolicitudesPendientes
        ? this.saleService.search({ estado: 'PENDIENTE' }).pipe(catchError(() => of([])))
        : of([]),
    }).subscribe({
      next: ({ stats, chart, appts, lowStock, pendingSales }) => {
        this.stats             = stats;
        this.chartData         = chart;
        this.todayAppointments = this.ordenarCitas(appts);
        this.lowStockProducts  = lowStock;
        this.pendingSalesCount = pendingSales.length;
        this.loading           = false;
      },
      error: () => { this.loading = false; },
    });
  }

  private ordenarCitas(citas: Appointment[]): Appointment[] {
    return [...citas].sort((a, b) => {
      const pa = PRIORIDAD_ESTADO[a.estado] ?? 99;
      const pb = PRIORIDAD_ESTADO[b.estado] ?? 99;
      if (pa !== pb) return pa - pb;
      return a.hora.localeCompare(b.hora);
    });
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  getStatusClass(estado: string): string {
    return estado.toLowerCase().replace('_', '-');
  }

  // ─── Paginación de los widgets ─────────────────────────────────────────────
  get pagedAppointments(): Appointment[] {
    return this.paginar(this.todayAppointments, this.appointmentsPage);
  }
  get totalAppointmentsPages(): number {
    return this.totalPaginas(this.todayAppointments.length);
  }

  get pagedServices() {
    return this.paginar(this.chartData?.serviciosMasVendidos ?? [], this.servicesPage);
  }
  get totalServicesPages(): number {
    return this.totalPaginas(this.chartData?.serviciosMasVendidos.length ?? 0);
  }

  get pagedLowStock(): Product[] {
    return this.paginar(this.lowStockProducts, this.lowStockPage);
  }
  get totalLowStockPages(): number {
    return this.totalPaginas(this.lowStockProducts.length);
  }

  rankDe(index: number): number {
    return this.servicesPage * this.pageSize + index + 1;
  }

  cambiarPagina(widget: Widget, delta: number): void {
    const totales: Record<Widget, number> = {
      appointments: this.totalAppointmentsPages,
      services: this.totalServicesPages,
      lowStock: this.totalLowStockPages,
    };
    const actual: Record<Widget, number> = {
      appointments: this.appointmentsPage,
      services: this.servicesPage,
      lowStock: this.lowStockPage,
    };
    const nueva = Math.min(Math.max(0, actual[widget] + delta), totales[widget] - 1);
    if (widget === 'appointments') this.appointmentsPage = nueva;
    if (widget === 'services') this.servicesPage = nueva;
    if (widget === 'lowStock') this.lowStockPage = nueva;
  }

  private paginar<T>(items: T[], page: number): T[] {
    const start = page * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }

  private totalPaginas(cantidad: number): number {
    return Math.max(1, Math.ceil(cantidad / this.pageSize));
  }
}
