import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomerService } from '../../../data/repositories/customer.service';
import { BusinessConfigService } from '../../../data/repositories/business-config.service';
import { Customer } from '../../../core/models/customer.model';
import { BusinessConfig, DEFAULT_BUSINESS_CONFIG } from '../../../core/models/business-config.model';
import { buildWhatsappLink } from '../../../core/utils/whatsapp.util';

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
  clienteCreado: Customer | null = null;
  private business: BusinessConfig = DEFAULT_BUSINESS_CONFIG;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private businessConfigService: BusinessConfigService,
    private snackBar: MatSnackBar,
  ) {
    this.businessConfigService.obtener().subscribe(cfg => (this.business = cfg));
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!id && this.route.snapshot.url.some(s => s.path === 'edit');

    this.form = this.fb.group({
      nombre:         ['', [Validators.required, Validators.minLength(2)]],
      apellido:       ['', [Validators.required, Validators.minLength(2)]],
      telefono:       ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{7,20}$/)]],
      correo:         ['', [Validators.email]],
      fechaNacimiento:[''],
      notas:          [''],
      estado:         [true],
    });

    if (this.isEdit && id) {
      this.loading = true;
      this.customerService.getById(+id).subscribe({
        next: (c) => { this.form.patchValue(c); this.loading = false; },
        error: (err: Error) => {
          this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
          this.router.navigate(['/customers']);
        },
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
      next: (cliente) => {
        this.snackBar.open(`Cliente ${this.isEdit ? 'actualizado' : 'creado'} correctamente`, '', { duration: 2500 });
        if (this.isEdit) {
          this.router.navigate(['/customers']);
        } else {
          this.saving = false;
          this.clienteCreado = cliente;
        }
      },
      error: (err: Error) => {
        this.saving = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  enviarBienvenidaWhatsapp(): void {
    if (!this.clienteCreado) return;
    window.open(
      buildWhatsappLink(this.clienteCreado, this.business.nombre, this.business.mensajeBienvenidaWhatsapp),
      '_blank',
    );
  }

  irAClientes(): void { this.router.navigate(['/customers']); }

  cancel(): void { this.router.navigate(['/customers']); }
}
