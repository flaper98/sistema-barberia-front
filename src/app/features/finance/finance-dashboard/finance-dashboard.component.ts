import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { FinanceCategory, FinanceEntry, FinanceSummary } from '../../../core/models/finance.model';
import { FinanceService } from '../../../data/repositories/finance.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { toLocalDateStr } from '../../../core/utils/date.util';

@Component({ selector: 'app-finance-dashboard', standalone: false, templateUrl: './finance-dashboard.component.html', styleUrls: ['./finance-dashboard.component.scss'] })
export class FinanceDashboardComponent implements OnInit {
  entries: FinanceEntry[] = [];
  summary: FinanceSummary | null = null;
  loading = true;
  filtering = false;
  showForm = false;
  saving = false;
  form!: FormGroup;
  activeTab = 0;

  categories = ['VENTA','ALQUILER','SALARIO','SUMINISTROS','SERVICIOS','MANTENIMIENTO','OTRO'];
  categoriaFiltro: FinanceCategory | null = null;
  fechaDesde: Date = new Date();
  fechaHasta: Date = new Date();

  constructor(
    private financeService: FinanceService,
    private authService: AuthService,
    private permissionService: PermissionService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  ) {}

  get puedeEditar(): boolean {
    return this.authService.hasRole(['ADMIN']) || this.permissionService.canEdit('FINANZAS');
  }

  ngOnInit(): void {
    const hoy = new Date();
    this.fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaHasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    this.initForm();
    this.load(true);
  }

  initForm(): void {
    this.form = this.fb.group({
      tipo: ['INGRESO', Validators.required],
      categoria: ['OTRO', Validators.required],
      descripcion: ['', Validators.required],
      monto: [0, [Validators.required, Validators.min(0.01)]],
      fecha: [toLocalDateStr(new Date()), Validators.required],
    });
  }

  onFiltersChange(): void {
    this.load(false);
  }

  load(initial: boolean): void {
    if (initial) this.loading = true; else this.filtering = true;
    const desde = this.toIsoDate(this.fechaDesde);
    const hasta = this.toIsoDate(this.fechaHasta);
    forkJoin({
      entries: this.financeService.search({
        fechaDesde: desde,
        fechaHasta: hasta,
        categoria: this.categoriaFiltro ?? undefined,
      }),
      summary: this.financeService.getSummary(desde, hasta),
    }).subscribe({
      next: ({ entries, summary }) => {
        this.entries = entries;
        this.summary = summary;
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

  get filteredEntries(): FinanceEntry[] {
    const tipo = this.activeTab === 0 ? null : this.activeTab === 1 ? 'INGRESO' : 'EGRESO';
    return tipo ? this.entries.filter(e => e.tipo === tipo) : this.entries;
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const user = this.authService.currentUser!;
    this.financeService.create({ ...this.form.value, usuarioId: user.id, usuarioNombre: `${user.nombre} ${user.apellido}` }).subscribe({
      next: () => {
        this.showForm = false;
        this.initForm();
        this.saving = false;
        this.snackBar.open('Registro agregado', '', { duration: 2500 });
        this.load(false);
      },
      error: (err: Error) => {
        this.saving = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }
}
