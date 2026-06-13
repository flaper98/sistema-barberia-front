import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Customer } from '../../../core/models/customer.model';
import { CustomerService } from '../../../data/repositories/customer.service';

@Component({
  selector: 'app-customer-list',
  standalone: false,
  templateUrl: './customer-list.component.html',
})
export class CustomerListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['nombre', 'telefono', 'correo', 'sellos', 'recompensas', 'ultimaVisita', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Customer>([]);
  loading = true;

  constructor(private customerService: CustomerService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.customerService.getAll().subscribe(data => {
      this.dataSource.data = data;
      setTimeout(() => {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      });
      this.loading = false;
    });
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  toggleStatus(customer: Customer): void {
    this.customerService.update(customer.id, { estado: !customer.estado }).subscribe(() => {
      customer.estado = !customer.estado;
      this.snackBar.open('Estado actualizado', '', { duration: 2000 });
    });
  }
}
