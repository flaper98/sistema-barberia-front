import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Product } from '../../../core/models/product.model';
import { ProductService } from '../../../data/repositories/product.service';
import { CategoriaDialogComponent } from '../categoria-dialog/categoria-dialog.component';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';

@Component({ selector: 'app-product-list', standalone: false, templateUrl: './product-list.component.html' })
export class ProductListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['nombre', 'categoria', 'precioVenta', 'precioCompra', 'stockActual', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Product>([]);
  loading = true;

  constructor(
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private authService: AuthService,
    private permissionService: PermissionService,
  ) {}

  get puedeEditar(): boolean {
    return this.authService.hasRole(['ADMIN']) || this.permissionService.canEdit('PRODUCTOS');
  }

  get puedeEliminar(): boolean {
    return this.authService.hasRole(['ADMIN']) || this.permissionService.canDelete('PRODUCTOS');
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.productService.getAll().subscribe({
      next: data => {
        this.dataSource.data = data;
        setTimeout(() => { this.dataSource.paginator = this.paginator; this.dataSource.sort = this.sort; });
        this.loading = false;
      },
      error: (err: Error) => { this.loading = false; this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }); },
    });
  }

  gestionarCategorias(): void {
    const ref = this.dialog.open(CategoriaDialogComponent, { width: '480px' });
    ref.afterClosed().subscribe(huboCambios => {
      if (huboCambios) this.load();
    });
  }

  applyFilter(e: Event): void { this.dataSource.filter = (e.target as HTMLInputElement).value.trim().toLowerCase(); }
  isLowStock(p: Product): boolean { return p.stockActual <= p.stockMinimo; }

  eliminar(p: Product): void {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esto lo dará de baja del sistema.`)) return;
    this.productService.delete(p.id).subscribe({
      next: () => {
        this.dataSource.data = this.dataSource.data.filter(x => x.id !== p.id);
        this.snackBar.open('Producto eliminado', '', { duration: 2500 });
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
  }
}
