import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BarberService } from '../../../core/models/service.model';
import { ServiceCatalogService } from '../../../data/repositories/service-catalog.service';

@Component({ selector: 'app-service-list', standalone: false, templateUrl: './service-list.component.html' })
export class ServiceListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  displayedColumns = ['nombre', 'categoria', 'precio', 'duracionMinutos', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<BarberService>([]);
  loading = true;

  constructor(private svc: ServiceCatalogService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.svc.getAll().subscribe(data => {
      this.dataSource.data = data;
      setTimeout(() => { this.dataSource.paginator = this.paginator; this.dataSource.sort = this.sort; });
      this.loading = false;
    });
  }

  applyFilter(e: Event): void { this.dataSource.filter = (e.target as HTMLInputElement).value.trim().toLowerCase(); }

  toggle(s: BarberService): void {
    this.svc.toggleStatus(s.id).subscribe(updated => {
      s.estado = updated.estado;
      this.snackBar.open(`Servicio ${updated.estado ? 'activado' : 'desactivado'}`, '', { duration: 2000 });
    });
  }
}
