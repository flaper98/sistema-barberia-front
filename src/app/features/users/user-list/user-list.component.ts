import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { Usuario } from '../../../core/models/usuario.model';
import { UsuarioService } from '../../../data/repositories/usuario.service';
import { WorkerService } from '../../../data/repositories/worker.service';
import { AuthService } from '../../../core/auth/auth.service';

const ROL_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  BARBER: 'Barbero',
  CASHIER: 'Cajero',
  RECEPTION: 'Recepción',
};

@Component({ selector: 'app-user-list', standalone: false, templateUrl: './user-list.component.html' })
export class UserListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['nombre', 'email', 'rol', 'barbero', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Usuario>([]);
  loading = true;

  private nombreBarberoPorId = new Map<number, string>();

  constructor(
    private usuarioService: UsuarioService,
    private workerService: WorkerService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    forkJoin({
      usuarios: this.usuarioService.getAll(),
      workers: this.workerService.getAll(),
    }).subscribe({
      next: ({ usuarios, workers }) => {
        this.nombreBarberoPorId = new Map(workers.map(w => [w.id, `${w.nombre} ${w.apellido}`]));
        this.dataSource.data = usuarios;
        setTimeout(() => { this.dataSource.paginator = this.paginator; this.dataSource.sort = this.sort; });
        this.loading = false;
      },
      error: (err: Error) => { this.loading = false; this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }); },
    });
  }

  applyFilter(e: Event): void {
    this.dataSource.filter = (e.target as HTMLInputElement).value.trim().toLowerCase();
  }

  toggleStatus(u: Usuario): void {
    this.usuarioService.toggleStatus(u.id, !u.estado).subscribe({
      next: () => {
        u.estado = !u.estado;
        this.snackBar.open('Estado actualizado', '', { duration: 2000 });
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
  }

  getRolLabel(rol: string): string {
    return ROL_LABELS[rol] ?? rol;
  }

  getBarberoNombre(u: Usuario): string {
    if (!u.barberoId) return '—';
    return this.nombreBarberoPorId.get(u.barberoId) ?? `#${u.barberoId}`;
  }

  esMiPropiaCuenta(u: Usuario): boolean {
    return u.id === this.authService.currentUser?.id;
  }

  eliminar(u: Usuario): void {
    if (this.esMiPropiaCuenta(u)) {
      this.snackBar.open('No podés eliminar tu propia cuenta', 'Cerrar', { duration: 4000 });
      return;
    }
    if (!confirm(`¿Eliminar a ${u.nombreCompleto || u.nombre}? Esto dará de baja su acceso al sistema.`)) return;
    this.usuarioService.delete(u.id).subscribe({
      next: () => {
        this.dataSource.data = this.dataSource.data.filter(x => x.id !== u.id);
        this.snackBar.open('Usuario eliminado', '', { duration: 2500 });
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
  }
}
