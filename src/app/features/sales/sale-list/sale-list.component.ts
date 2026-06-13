import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Sale } from '../../../core/models/sale.model';
import { SaleService } from '../../../data/repositories/sale.service';

@Component({
  selector: 'app-sale-list',
  standalone: false,
  templateUrl: './sale-list.component.html',
})
export class SaleListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['id', 'fecha', 'clienteNombre', 'barberoNombre', 'tipoVenta', 'total', 'metodoPago', 'estado'];
  dataSource = new MatTableDataSource<Sale>([]);
  loading = true;

  constructor(private saleService: SaleService) {}

  ngOnInit(): void {
    this.saleService.getAll().subscribe(sales => {
      this.dataSource.data = sales;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.loading = false;
    });
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  }
}
