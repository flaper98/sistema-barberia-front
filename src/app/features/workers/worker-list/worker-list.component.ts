import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { Worker } from '../../../core/models/worker.model';
import { WorkerService } from '../../../data/repositories/worker.service';
import { UsuarioService } from '../../../data/repositories/usuario.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { matchesSearch } from '../../../core/utils/search.util';

@Component({
  selector: 'app-worker-list',
  standalone: false,
  templateUrl: './worker-list.component.html',
  styleUrls: ['./worker-list.component.scss'],
})
export class WorkerListComponent implements OnInit {
  workers: Worker[] = [];
  filtered: Worker[] = [];
  search = '';
  loading = true;
  private barberosConUsuario = new Set<number>();

  constructor(
    private workerService: WorkerService,
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private permissionService: PermissionService,
    private snackBar: MatSnackBar,
  ) {}

  get isAdmin(): boolean {
    return this.authService.hasRole(['ADMIN']);
  }

  get puedeEliminar(): boolean {
    return this.isAdmin || this.permissionService.canDelete('BARBEROS');
  }

  get puedeEditar(): boolean {
    return this.isAdmin || this.permissionService.canEdit('BARBEROS');
  }

  ngOnInit(): void {
    // /api/users es solo para ADMIN; los demás roles ni deben consultarlo.
    forkJoin({
      workers: this.workerService.getAll(),
      usuarios: this.isAdmin ? this.usuarioService.getAll() : of([]),
    }).subscribe({
      next: ({ workers, usuarios }) => {
        this.workers = workers;
        this.filtered = workers;
        this.barberosConUsuario = new Set(
          usuarios.filter(u => u.barberoId != null).map(u => u.barberoId!),
        );
        this.loading = false;
      },
      error: (err: Error) => { this.loading = false; this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }); },
    });
  }

  tieneUsuario(worker: Worker): boolean {
    return this.barberosConUsuario.has(worker.id);
  }

  applyFilter(): void {
    this.filtered = this.workers.filter(w =>
      matchesSearch(this.search, w.nombre, w.apellido, w.especialidad)
    );
  }

  toggleStatus(worker: Worker): void {
    this.workerService.update(worker.id, { estado: !worker.estado }).subscribe({
      next: () => { worker.estado = !worker.estado; this.snackBar.open('Estado actualizado', '', { duration: 2000 }); },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
  }

  eliminar(worker: Worker): void {
    if (!confirm(`¿Eliminar a ${worker.nombre} ${worker.apellido}? Esto lo dará de baja del sistema.`)) return;
    this.workerService.delete(worker.id).subscribe({
      next: () => {
        this.workers = this.workers.filter(w => w.id !== worker.id);
        this.filtered = this.filtered.filter(w => w.id !== worker.id);
        this.snackBar.open('Barbero eliminado', '', { duration: 2500 });
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
  }
}
