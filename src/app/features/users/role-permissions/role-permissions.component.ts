import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { PermissionService } from '../../../core/auth/permission.service';
import { MODULOS, ROLES_CONFIGURABLES, Modulo, PermisoFlags, RolConfigurable, RolPermisoItem } from '../../../core/models/permission.model';

interface FilaMatriz {
  modulo: Modulo;
  label: string;
  porRol: Record<RolConfigurable, PermisoFlags>;
}

@Component({ selector: 'app-role-permissions', standalone: false, templateUrl: './role-permissions.component.html' })
export class RolePermissionsComponent implements OnInit {
  readonly roles = ROLES_CONFIGURABLES;
  filas: FilaMatriz[] = [];
  loading = true;
  saving = false;

  constructor(
    private permissionService: PermissionService,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.loading = true;
    this.permissionService.obtenerMatriz().subscribe({
      next: matriz => {
        this.filas = MODULOS.map(m => ({
          modulo: m.value,
          label: m.label,
          porRol: {
            BARBER: matriz.BARBER?.[m.value] ?? { puedeVer: false, puedeEditar: false, puedeEliminar: false },
            CASHIER: matriz.CASHIER?.[m.value] ?? { puedeVer: false, puedeEditar: false, puedeEliminar: false },
            RECEPTION: matriz.RECEPTION?.[m.value] ?? { puedeVer: false, puedeEditar: false, puedeEliminar: false },
          },
        }));
        this.loading = false;
      },
      error: (err: Error) => {
        this.loading = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  onVerChange(fila: FilaMatriz, rol: RolConfigurable, marcado: boolean): void {
    fila.porRol[rol].puedeVer = marcado;
    if (!marcado) {
      fila.porRol[rol].puedeEditar = false;
      fila.porRol[rol].puedeEliminar = false;
    }
  }

  onEditarChange(fila: FilaMatriz, rol: RolConfigurable, marcado: boolean): void {
    fila.porRol[rol].puedeEditar = marcado;
    if (marcado) fila.porRol[rol].puedeVer = true;
    else fila.porRol[rol].puedeEliminar = false;
  }

  onEliminarChange(fila: FilaMatriz, rol: RolConfigurable, marcado: boolean): void {
    fila.porRol[rol].puedeEliminar = marcado;
    if (marcado) {
      fila.porRol[rol].puedeVer = true;
      fila.porRol[rol].puedeEditar = true;
    }
  }

  guardar(): void {
    const items: RolPermisoItem[] = [];
    for (const fila of this.filas) {
      for (const rol of this.roles) {
        const flags = fila.porRol[rol.value];
        items.push({
          rol: rol.value,
          modulo: fila.modulo,
          puedeVer: flags.puedeVer,
          puedeEditar: flags.puedeEditar,
          puedeEliminar: flags.puedeEliminar,
        });
      }
    }
    this.saving = true;
    this.permissionService.actualizarMatriz(items).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Permisos actualizados correctamente', '', { duration: 2500 });
      },
      error: (err: Error) => {
        this.saving = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  volver(): void {
    this.router.navigate(['/users']);
  }
}
