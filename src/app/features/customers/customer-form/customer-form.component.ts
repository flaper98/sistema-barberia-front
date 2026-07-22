import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomerService } from '../../../data/repositories/customer.service';
import { BusinessConfigService } from '../../../data/repositories/business-config.service';
import { Customer } from '../../../core/models/customer.model';
import { BusinessConfig, DEFAULT_BUSINESS_CONFIG } from '../../../core/models/business-config.model';
import { buildWhatsappLink } from '../../../core/utils/whatsapp.util';
import { formatCodigo } from '../../../core/utils/format.util';

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
  // Vista previa del codigo que le va a tocar al proximo cliente -- se
  // confirma recien cuando se guarda (ver clienteCreado.id), esto es solo
  // para mostrarlo mientras se completa el formulario.
  proximoCodigo: string | null = null;
  private business: BusinessConfig = DEFAULT_BUSINESS_CONFIG;

  // Correo y fecha de nacimiento ya no se piden al registrar un cliente --
  // pero si un cliente existente ya los tenia cargados de antes, no hay que
  // borrarlos solo por editar otro campo (el backend hace un reemplazo
  // completo, no un merge -- ver ClienteServiceImpl.actualizar()). Se
  // guardan aca (fuera del form, ya que no hay campo visible) y se mandan
  // de vuelta tal cual al guardar.
  private correoExistente: string | undefined;
  private fechaNacimientoExistente: string | undefined;

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
      telefono:       ['', [Validators.required, Validators.pattern(/^[0-9]{7,20}$/)]],
      notas:          [''],
      estado:         [true],
    });

    if (this.isEdit && id) {
      this.loading = true;
      this.customerService.getById(+id).subscribe({
        next: (c) => {
          this.form.patchValue(c);
          this.correoExistente = c.correo;
          this.fechaNacimientoExistente = c.fechaNacimiento;
          this.loading = false;
        },
        error: (err: Error) => {
          this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
          this.router.navigate(['/customers']);
        },
      });
    } else {
      this.customerService.getNextCode().subscribe({
        next: codigo => (this.proximoCodigo = codigo != null ? formatCodigo(codigo) : null),
        error: () => {}, // solo informativo -- si falla, el formulario sigue andando igual
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const id = this.route.snapshot.paramMap.get('id');
    const valores = { ...this.form.value, correo: this.correoExistente, fechaNacimiento: this.fechaNacimientoExistente };
    const op$ = this.isEdit
      ? this.customerService.update(+id!, valores)
      : this.customerService.create({ ...valores, cantidadSellos: 0, recompensasDisponibles: 0 });

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

  formatId(id: number): string {
    return formatCodigo(id);
  }

  // El telefono ahora solo acepta digitos -- se limpia en vivo mientras se
  // escribe (en vez de solo avisar con un error despues) para que no se
  // pueda ni pegar un numero con +, espacios o guiones.
  soloNumeros(event: Event): void {
    const input = event.target as HTMLInputElement;
    const limpio = input.value.replace(/\D/g, '');
    if (limpio !== input.value) {
      this.form.get('telefono')?.setValue(limpio);
    }
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
