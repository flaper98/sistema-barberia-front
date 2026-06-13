import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WorkerService } from '../../../data/repositories/worker.service';

@Component({ selector: 'app-worker-form', standalone: false, templateUrl: './worker-form.component.html' })
export class WorkerFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false; loading = false; saving = false;

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private router: Router, private workerService: WorkerService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!id && !isNaN(+id);
    this.form = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      especialidad: ['', [Validators.required]],
      porcentajeComision: [35, [Validators.required, Validators.min(0), Validators.max(100)]],
      estado: [true],
    });
    if (this.isEdit) {
      this.loading = true;
      this.workerService.getById(+id!).subscribe({ next: w => { this.form.patchValue(w); this.loading = false; }, error: () => this.router.navigate(['/workers']) });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const id = this.route.snapshot.paramMap.get('id');
    const op$ = this.isEdit ? this.workerService.update(+id!, this.form.value) : this.workerService.create(this.form.value);
    op$.subscribe({ next: () => { this.snackBar.open(`Barbero ${this.isEdit ? 'actualizado' : 'creado'}`, '', { duration: 2500 }); this.router.navigate(['/workers']); }, error: () => { this.saving = false; } });
  }

  cancel(): void { this.router.navigate(['/workers']); }
}
