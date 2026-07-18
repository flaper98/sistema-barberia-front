import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Paquete } from '../../../core/models/paquete.model';
import { PaqueteService } from '../../../data/repositories/paquete.service';

@Component({
  selector: 'app-paquete-dialog',
  standalone: false,
  templateUrl: './paquete-dialog.component.html',
})
export class PaqueteDialogComponent implements OnInit {
  paquetes: Paquete[] = [];
  loading = true;
  huboCambios = false;

  editandoId: number | null = null;
  creandoNuevo = false;
  guardando = false;
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private paqueteService: PaqueteService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<PaqueteDialogComponent>,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', [Validators.required, Validators.maxLength(2000)]],
      precio: [0, [Validators.required, Validators.min(0)]],
    });
    this.cargar();
  }

  private cargar(): void {
    this.loading = true;
    this.paqueteService.getTodos().subscribe({
      next: data => { this.paquetes = data; this.loading = false; },
      error: (err: Error) => { this.loading = false; this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }); },
    });
  }

  empezarNuevo(): void {
    this.creandoNuevo = true;
    this.editandoId = null;
    this.form.reset({ nombre: '', descripcion: '', precio: 0 });
  }

  empezarEdicion(p: Paquete): void {
    this.editandoId = p.id;
    this.creandoNuevo = false;
    this.form.reset({ nombre: p.nombre, descripcion: p.descripcion, precio: p.precio });
  }

  cancelar(): void {
    this.editandoId = null;
    this.creandoNuevo = false;
  }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    const data = this.form.value;

    const op$ = this.editandoId != null
      ? this.paqueteService.actualizar(this.editandoId, data)
      : this.paqueteService.crear(data);

    op$.subscribe({
      next: paquete => {
        if (this.editandoId != null) {
          const idx = this.paquetes.findIndex(p => p.id === paquete.id);
          if (idx > -1) this.paquetes[idx] = paquete;
        } else {
          this.paquetes.push(paquete);
        }
        this.paquetes.sort((a, b) => a.precio - b.precio);
        this.guardando = false;
        this.huboCambios = true;
        this.editandoId = null;
        this.creandoNuevo = false;
        this.snackBar.open('Paquete guardado', '', { duration: 2000 });
      },
      error: (err: Error) => {
        this.guardando = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  toggleEstado(p: Paquete): void {
    this.paqueteService.toggleStatus(p.id, !p.estado).subscribe({
      next: () => { p.estado = !p.estado; this.huboCambios = true; },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
  }

  cerrar(): void {
    this.dialogRef.close(this.huboCambios);
  }
}
