import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ServiceCatalogService } from '../../../data/repositories/service-catalog.service';

@Component({ selector: 'app-service-form', standalone: false, templateUrl: './service-form.component.html' })
export class ServiceFormComponent implements OnInit {
  form!: FormGroup; isEdit = false; loading = false; saving = false;
  categories = ['CORTE','BARBA','TRATAMIENTO','COLOR','COMBO'];

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private router: Router, private svc: ServiceCatalogService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!id && !isNaN(+id);
    this.form = this.fb.group({ nombre: ['', Validators.required], categoria: ['CORTE', Validators.required], precio: [0, [Validators.required, Validators.min(0)]], duracionMinutos: [30, [Validators.required, Validators.min(5)]], descripcion: [''], estado: [true] });
    if (this.isEdit) {
      this.loading = true;
      this.svc.getById(+id!).subscribe({ next: s => { this.form.patchValue(s); this.loading = false; }, error: () => this.router.navigate(['/services']) });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const id = this.route.snapshot.paramMap.get('id');
    const op$ = this.isEdit ? this.svc.update(+id!, this.form.value) : this.svc.create(this.form.value);
    op$.subscribe({ next: () => { this.snackBar.open('Servicio guardado', '', { duration: 2500 }); this.router.navigate(['/services']); }, error: () => { this.saving = false; } });
  }

  cancel(): void { this.router.navigate(['/services']); }
}
