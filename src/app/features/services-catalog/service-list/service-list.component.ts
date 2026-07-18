import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { BarberService } from '../../../core/models/service.model';
import { ServiceCatalogService } from '../../../data/repositories/service-catalog.service';
import { PaqueteDialogComponent } from '../paquete-dialog/paquete-dialog.component';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';

@Component({ selector: 'app-service-list', standalone: false, templateUrl: './service-list.component.html' })
export class ServiceListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  displayedColumns = ['nombre', 'categoria', 'precio', 'duracionMinutos', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<BarberService>([]);
  loading = true;

  constructor(
    private svc: ServiceCatalogService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private authService: AuthService,
    private permissionService: PermissionService,
  ) {}

  get puedeEditar(): boolean {
    return this.authService.hasRole(['ADMIN']) || this.permissionService.canEdit('SERVICIOS');
  }

  get puedeEliminar(): boolean {
    return this.authService.hasRole(['ADMIN']) || this.permissionService.canDelete('SERVICIOS');
  }

  ngOnInit(): void {
    this.svc.getAll().subscribe({
      next: data => {
        this.dataSource.data = data;
        setTimeout(() => { this.dataSource.paginator = this.paginator; this.dataSource.sort = this.sort; });
        this.loading = false;
      },
      error: (err: Error) => { this.loading = false; this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }); },
    });
  }

  applyFilter(e: Event): void { this.dataSource.filter = (e.target as HTMLInputElement).value.trim().toLowerCase(); }

  gestionarPaquetes(): void {
    this.dialog.open(PaqueteDialogComponent, { width: '520px' });
  }

  toggle(s: BarberService): void {
    this.svc.toggleStatus(s.id).subscribe({
      next: updated => {
        s.estado = updated.estado;
        this.snackBar.open(`Servicio ${updated.estado ? 'activado' : 'desactivado'}`, '', { duration: 2000 });
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
  }

  eliminar(s: BarberService): void {
    if (!confirm(`¿Eliminar "${s.nombre}"? Esto lo dará de baja del sistema.`)) return;
    this.svc.delete(s.id).subscribe({
      next: () => {
        this.dataSource.data = this.dataSource.data.filter(x => x.id !== s.id);
        this.snackBar.open('Servicio eliminado', '', { duration: 2500 });
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
  }
}
