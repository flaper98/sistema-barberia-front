import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoriaProducto } from '../../../core/models/categoria-producto.model';
import { CategoriaProductoService } from '../../../data/repositories/categoria-producto.service';

@Component({
  selector: 'app-categoria-dialog',
  standalone: false,
  templateUrl: './categoria-dialog.component.html',
})
export class CategoriaDialogComponent implements OnInit {
  categorias: CategoriaProducto[] = [];
  loading = true;
  nuevaCategoria = new FormControl('', [Validators.required, Validators.maxLength(80)]);
  guardandoNueva = false;
  editandoId: number | null = null;
  nombreEditado = '';
  huboCambios = false;

  constructor(
    private categoriaService: CategoriaProductoService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<CategoriaDialogComponent>,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.loading = true;
    this.categoriaService.getTodas().subscribe({
      next: data => { this.categorias = data; this.loading = false; },
      error: (err: Error) => { this.loading = false; this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }); },
    });
  }

  agregar(): void {
    if (this.nuevaCategoria.invalid) { this.nuevaCategoria.markAsTouched(); return; }
    this.guardandoNueva = true;
    this.categoriaService.crear(this.nuevaCategoria.value!.trim()).subscribe({
      next: categoria => {
        this.categorias.push(categoria);
        this.categorias.sort((a, b) => a.nombre.localeCompare(b.nombre));
        this.nuevaCategoria.reset('');
        this.guardandoNueva = false;
        this.huboCambios = true;
      },
      error: (err: Error) => {
        this.guardandoNueva = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  empezarEdicion(c: CategoriaProducto): void {
    this.editandoId = c.id;
    this.nombreEditado = c.nombre;
  }

  cancelarEdicion(): void {
    this.editandoId = null;
  }

  guardarEdicion(c: CategoriaProducto): void {
    const nombre = this.nombreEditado.trim();
    if (!nombre || nombre === c.nombre) { this.editandoId = null; return; }
    this.categoriaService.renombrar(c.id, nombre).subscribe({
      next: actualizada => {
        c.nombre = actualizada.nombre;
        this.editandoId = null;
        this.huboCambios = true;
        this.snackBar.open('Categoría actualizada', '', { duration: 2000 });
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
  }

  toggleEstado(c: CategoriaProducto): void {
    this.categoriaService.toggleStatus(c.id, !c.estado).subscribe({
      next: () => { c.estado = !c.estado; this.huboCambios = true; },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
  }

  cerrar(): void {
    this.dialogRef.close(this.huboCambios);
  }
}
