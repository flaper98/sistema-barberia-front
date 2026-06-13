import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Product } from '../../../core/models/product.model';
import { ProductService } from '../../../data/repositories/product.service';

@Component({ selector: 'app-product-list', standalone: false, templateUrl: './product-list.component.html' })
export class ProductListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['nombre', 'categoria', 'precioVenta', 'precioCompra', 'stockActual', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Product>([]);
  loading = true;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.productService.getAll().subscribe(data => {
      this.dataSource.data = data;
      setTimeout(() => { this.dataSource.paginator = this.paginator; this.dataSource.sort = this.sort; });
      this.loading = false;
    });
  }

  applyFilter(e: Event): void { this.dataSource.filter = (e.target as HTMLInputElement).value.trim().toLowerCase(); }
  isLowStock(p: Product): boolean { return p.stockActual <= p.stockMinimo; }
}
