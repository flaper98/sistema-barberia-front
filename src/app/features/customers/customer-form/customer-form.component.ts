import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomerService } from '../../../data/repositories/customer.service';

@Component({
  selector: 'app-customer-form',
  standalone: false,
  templateUrl: './customer-form.component.html',
})
export class CustomerFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  loading = false;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!id && this.route.snapshot.url.some(s => s.path === 'edit');

    this.form = this.fb.group({
      nombre:         ['', [Validators.required, Validators.minLength(2)]],
      apellido:       ['', [Validators.required, Validators.minLength(2)]],
      telefono:       ['', [Validators.required, Validators.pattern(/^\d{9,}$/)]],
      correo:         ['', [Validators.email]],
      fechaNacimiento:[''],
      notas:          [''],
      estado:         [true],
    });

    if (this.isEdit && id) {
      this.loading = true;
      this.customerService.getById(+id).subscribe({
        next: (c) => { this.form.patchValue(c); this.loading = false; },
        error: () => { this.router.navigate(['/customers']); },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const id = this.route.snapshot.paramMap.get('id');
    const op$ = this.isEdit
      ? this.customerService.update(+id!, this.form.value)
      : this.customerService.create({ ...this.form.value, cantidadSellos: 0, recompensasDisponibles: 0 });

    op$.subscribe({
      next: () => {
        this.snackBar.open(`Cliente ${this.isEdit ? 'actualizado' : 'creado'} correctamente`, '', { duration: 2500 });
        this.router.navigate(['/customers']);
      },
      error: () => { this.saving = false; },
    });
  }

  cancel(): void { this.router.navigate(['/customers']); }
}
