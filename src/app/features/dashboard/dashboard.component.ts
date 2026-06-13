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
  loading = true;

  readonly today = new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  constructor(
    private dashboardService: DashboardService,
    private appointmentService: AppointmentService,
    private productService: ProductService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    const todayStr = new Date().toISOString().split('T')[0];

    const defaultStats: DashboardStats = {
      ventasHoy: 0, ingresosHoy: 0, citasHoy: 0, clientesAtendidos: 0,
      productosStockBajo: 0, barberoTopNombre: '-', barberoTopMonto: 0, recompensasPendientes: 0,
    };
    const defaultChart: DashboardChartData = {
      ventasSemana: [], serviciosMasVendidos: [], citasPorEstado: [],
    };

    forkJoin({
      stats:    this.dashboardService.getStats().pipe(catchError(() => of(defaultStats))),
      chart:    this.dashboardService.getChartData().pipe(catchError(() => of(defaultChart))),
      appts:    this.appointmentService.getByDate(todayStr).pipe(catchError(() => of([] as Appointment[]))),
      lowStock: this.productService.getLowStock().pipe(catchError(() => of([] as Product[]))),
    }).subscribe({
      next: ({ stats, chart, appts, lowStock }) => {
        this.stats             = stats;
        this.chartData         = chart;
        this.todayAppointments = appts.slice(0, 5);
        this.lowStockProducts  = lowStock;
        this.loading           = false;
      },
      error: () => { this.loading = false; },
    });
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  getBarWidth(monto: number): number {
    if (!this.chartData?.ventasSemana.length) return 0;
    const max = Math.max(...this.chartData.ventasSemana.map(v => v.monto));
    return max > 0 ? (monto / max) * 100 : 0;
  }

  getStatusClass(estado: string): string {
    return estado.toLowerCase().replace('_', '-');
  }
}
