import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Sale } from '../../../core/models/sale.model';
import { Appointment } from '../../../core/models/appointment.model';
import { Product } from '../../../core/models/product.model';
import { SaleService } from '../../../data/repositories/sale.service';
import { AppointmentService } from '../../../data/repositories/appointment.service';
import { ProductService } from '../../../data/repositories/product.service';

interface WorkerReport { nombre: string; ventas: number; total: number; comision: number; }
interface ServiceReport { nombre: string; cantidad: number; total: number; }

@Component({ selector: 'app-reports-dashboard', standalone: false, templateUrl: './reports-dashboard.component.html', styleUrls: ['./reports-dashboard.component.scss'] })
export class ReportsDashboardComponent implements OnInit {
  sales: Sale[] = [];
  appointments: Appointment[] = [];
  lowStock: Product[] = [];
  loading = true;

  workerReports: WorkerReport[] = [];
  serviceReports: ServiceReport[] = [];

  fechaDesde = '';
  fechaHasta = '';

  constructor(
    private saleService: SaleService,
    private apptService: AppointmentService,
    private productService: ProductService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      sales:    this.saleService.getAll(),
      appts:    this.apptService.getAll(),
      lowStock: this.productService.getLowStock(),
    }).subscribe(({ sales, appts, lowStock }) => {
      this.sales = sales;
      this.appointments = appts;
      this.lowStock = lowStock;
      this.buildReports();
      this.loading = false;
    });
  }

  buildReports(): void {
    // Workers report
    const workerMap = new Map<string, { ventas: number; total: number }>();
    this.sales.filter(s => s.estado === 'COMPLETADA').forEach(s => {
      const e = workerMap.get(s.barberoNombre) || { ventas: 0, total: 0 };
      e.ventas += 1; e.total += s.total;
      workerMap.set(s.barberoNombre, e);
    });
    this.workerReports = Array.from(workerMap.entries())
      .map(([nombre, { ventas, total }]) => ({ nombre, ventas, total, comision: total * 0.35 }))
      .sort((a, b) => b.total - a.total);

    // Services report
    const svcMap = new Map<string, { cantidad: number; total: number }>();
    this.sales.forEach(s => s.items.filter(i => i.tipo === 'SERVICIO').forEach(i => {
      const e = svcMap.get(i.nombre) || { cantidad: 0, total: 0 };
      e.cantidad += i.cantidad; e.total += i.subtotal;
      svcMap.set(i.nombre, e);
    }));
    this.serviceReports = Array.from(svcMap.entries())
      .map(([nombre, { cantidad, total }]) => ({ nombre, cantidad, total }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  get totalVentas(): number { return this.sales.filter(s => s.estado === 'COMPLETADA').length; }
  get totalIngresos(): number { return this.sales.filter(s => s.estado === 'COMPLETADA').reduce((a, s) => a + s.total, 0); }
  get citasAtendidas(): number { return this.appointments.filter(a => a.estado === 'ATENDIDA').length; }
  get citasCanceladas(): number { return this.appointments.filter(a => a.estado === 'CANCELADA').length; }
}
