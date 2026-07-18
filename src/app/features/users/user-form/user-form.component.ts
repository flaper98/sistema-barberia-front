import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { Worker } from '../../../core/models/worker.model';
import { Usuario, UsuarioRequest } from '../../../core/models/usuario.model';
import { UsuarioService } from '../../../data/repositories/usuario.service';
import { WorkerService } from '../../../data/repositories/worker.service';

@Component({ selector: 'app-user-form', standalone: false, templateUrl: './user-form.component.html' })
export class UserFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  loading = false;
  saving = false;

  workers: Worker[] = [];
  usuarios: Usuario[] = [];

  readonly roles = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'BARBER', label: 'Barbero' },
    { value: 'CASHIER', label: 'Cajero' },
    { value: 'RECEPTION', label: 'Recepción' },
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private usuarioService: UsuarioService,
    private workerService: WorkerService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!id && !isNaN(+id);

    this.form = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.isEdit ? [] : [Validators.required, Validators.minLength(6)]],
      rol: ['BARBER', Validators.required],
      barberoId: [null],
    });

    if (!this.isEdit) {
      const barberoIdParam = this.route.snapshot.queryParamMap.get('barberoId');
      if (barberoIdParam) {
        this.form.patchValue({ rol: 'BARBER', barberoId: +barberoIdParam });
      }
    }

    this.loading = true;
    forkJoin({
      workers: this.workerService.getAll(),
      usuarios: this.usuarioService.getAll(),
    }).subscribe({
      next: ({ workers, usuarios }) => {
        this.workers = workers;
        this.usuarios = usuarios;
        this.loading = false;

        if (this.isEdit) {
          this.usuarioService.getById(+id!).subscribe({
            next: u => {
              this.form.patchValue({
                nombre: u.nombre,
                apellido: u.apellido,
                email: u.email,
                rol: u.rol,
                barberoId: u.barberoId ?? null,
              });
            },
            error: (err: Error) => {
              this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
              this.router.navigate(['/users']);
            },
          });
        }
      },
      error: (err: Error) => {
        this.loading = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  get isBarberRole(): boolean {
    return this.form?.get('rol')?.value === 'BARBER';
  }

  /** Barberos ya vinculados a OTRO usuario quedan fuera, para no chocar con la validación del backend. */
  get availableWorkers(): Worker[] {
    const currentId = this.route.snapshot.paramMap.get('id');
    const selectedId = this.form.get('barberoId')?.value;
    const linkedIds = new Set(
      this.usuarios
        .filter(u => u.barberoId != null && !(this.isEdit && u.id === +currentId!))
        .map(u => u.barberoId),
    );
    return this.workers.filter(w => !linkedIds.has(w.id) || w.id === selectedId);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const v = this.form.value;
    const data: UsuarioRequest = {
      nombre: v.nombre,
      apellido: v.apellido,
      email: v.email,
      password: v.password || undefined,
      rol: v.rol,
      barberoId: v.rol === 'BARBER' ? v.barberoId : null,
    };
    const id = this.route.snapshot.paramMap.get('id');
    const op$ = this.isEdit ? this.usuarioService.update(+id!, data) : this.usuarioService.create(data);

    op$.subscribe({
      next: () => {
        this.snackBar.open(`Usuario ${this.isEdit ? 'actualizado' : 'creado'} correctamente`, '', { duration: 2500 });
        this.router.navigate(['/users']);
      },
      error: (err: Error) => {
        this.saving = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }
}
