import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { StockMovement } from '../../../core/models/product.model';
import { ProductService } from '../../../data/repositories/product.service';

@Component({ selector: 'app-inventory-list', standalone: false, templateUrl: './inventory-list.component.html' })
export class InventoryListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  displayedColumns = ['fecha', 'productoNombre', 'tipoMovimiento', 'cantidad', 'stockAnterior', 'stockNuevo', 'motivo', 'usuarioNombre'];
  dataSource = new MatTableDataSource<StockMovement>([]);
  loading = true;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.productService.getMovements().subscribe(data => {
      this.dataSource.data = data;
      setTimeout(() => { this.dataSource.paginator = this.paginator; this.dataSource.sort = this.sort; });
      this.loading = false;
    });
  }

  applyFilter(e: Event): void { this.dataSource.filter = (e.target as HTMLInputElement).value.trim().toLowerCase(); }
  getMovClass(tipo: string): string { return tipo === 'ENTRADA' ? 'active' : tipo === 'SALIDA' ? 'warn' : 'pendiente'; }
}
