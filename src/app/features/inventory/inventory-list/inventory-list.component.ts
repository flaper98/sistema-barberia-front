import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StockMovement } from '../../../core/models/product.model';
import { ProductService } from '../../../data/repositories/product.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';

@Component({ selector: 'app-inventory-list', standalone: false, templateUrl: './inventory-list.component.html' })
export class InventoryListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  displayedColumns = ['id', 'createdAt', 'productoNombre', 'tipoMovimiento', 'cantidad', 'stockAnterior', 'stockNuevo', 'motivo', 'usuarioNombre'];
  dataSource = new MatTableDataSource<StockMovement>([]);
  loading = true;

  constructor(
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private permissionService: PermissionService,
  ) {}

  get puedeEditar(): boolean {
    return this.authService.hasRole(['ADMIN']) || this.permissionService.canEdit('INVENTARIO');
  }

  ngOnInit(): void {
    this.productService.getMovements().subscribe({
      next: data => {
        this.dataSource.data = data;
        setTimeout(() => { this.dataSource.paginator = this.paginator; this.dataSource.sort = this.sort; });
        this.loading = false;
      },
      error: (err: Error) => { this.loading = false; this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }); },
    });
  }

  applyFilter(e: Event): void { this.dataSource.filter = (e.target as HTMLInputElement).value.trim().toLowerCase(); }
  getMovClass(tipo: string): string { return tipo === 'ENTRADA' ? 'active' : tipo === 'SALIDA' ? 'warn' : 'pendiente'; }
  formatId(id: number): string { return id.toString().padStart(4, '0'); }
}
