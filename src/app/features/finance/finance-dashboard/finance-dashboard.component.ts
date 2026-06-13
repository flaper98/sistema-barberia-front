import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FinanceEntry, FinanceSummary } from '../../../core/models/finance.model';
import { FinanceService } from '../../../data/repositories/finance.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({ selector: 'app-finance-dashboard', standalone: false, templateUrl: './finance-dashboard.component.html', styleUrls: ['./finance-dashboard.component.scss'] })
export class FinanceDashboardComponent implements OnInit {
  entries: FinanceEntry[] = [];
  summary: FinanceSummary | null = null;
  loading = true;
  showForm = false;
  saving = false;
  form!: FormGroup;
  activeTab = 0;

  categories = ['VENTA','ALQUILER','SALARIO','SUMINISTROS','SERVICIOS','MANTENIMIENTO','OTRO'];

  constructor(private financeService: FinanceService, private authService: AuthService, private fb: FormBuilder, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.initForm();
    this.load();
  }

  initForm(): void {
    this.form = this.fb.group({
      tipo: ['INGRESO', Validators.required],
      categoria: ['OTRO', Validators.required],
      descripcion: ['', Validators.required],
      monto: [0, [Validators.required, Validators.min(0.01)]],
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
    });
  }

  load(): void {
    this.loading = true;
    this.financeService.getAll().subscribe(data => {
      this.entries = data;
      this.financeService.getSummary().subscribe(s => { this.summary = s; this.loading = false; });
    });
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
      next: (entry) => {
        this.entries.unshift(entry);
        this.financeService.getSummary().subscribe(s => this.summary = s);
        this.showForm = false;
        this.initForm();
        this.saving = false;
        this.snackBar.open('Registro agregado', '', { duration: 2500 });
      },
      error: () => { this.saving = false; },
    });
  }
}
