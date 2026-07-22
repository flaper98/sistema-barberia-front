import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Customer } from '../../../core/models/customer.model';
import { BusinessConfig, DEFAULT_BUSINESS_CONFIG } from '../../../core/models/business-config.model';
import { CustomerService } from '../../../data/repositories/customer.service';
import { BusinessConfigService } from '../../../data/repositories/business-config.service';
import { LoyaltyService } from '../../../data/repositories/loyalty.service';
import { buildWhatsappLink } from '../../../core/utils/whatsapp.util';
import { formatCodigo } from '../../../core/utils/format.util';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';

type FiltroRecompensa = 'todos' | 'con' | 'sin';
type FiltroInactividad = 'todos' | 'nunca' | '30' | '60' | '90';

@Component({
  selector: 'app-customer-list',
  standalone: false,
  templateUrl: './customer-list.component.html',
})
export class CustomerListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['id', 'nombre', 'telefono', 'sellos', 'recompensas', 'ultimaVisita', 'acciones'];

  // Busqueda, orden y paginacion resueltos del lado del servidor -- con
  // miles de clientes, traerlos todos al frontend para filtrar/ordenar ahi
  // (como hacia antes esta pantalla) es la forma mas lenta posible de
  // hacerlo. El orden por defecto es por ID (igual que antes de esta
  // optimizacion); las columnas con flechita en el header reordenan
  // pidiendole al backend la pagina ya ordenada, no reordenan solo lo que
  // ya esta cargado.
  customers: Customer[] = [];
  totalElements = 0;
  pageIndex = 0;
  pageSize = 20;
  sortBy = 'id';
  sortDir: 'asc' | 'desc' = 'asc';
  loading = true;

  descripcionRecompensa = '';
  sellosNecesarios = 5;
  private business: BusinessConfig = DEFAULT_BUSINESS_CONFIG;

  search = '';
  sellosMin: number | null = null;
  filtroRecompensa: FiltroRecompensa = 'todos';
  filtroInactividad: FiltroInactividad = 'todos';

  // El texto libre se debounce para no pegarle una consulta al backend en
  // cada tecla -- los demas filtros (select/numero) son eventos discretos,
  // no hace falta. El Subject lleva el texto (no void): distinctUntilChanged
  // necesita un valor real para comparar, si no todas las emisiones quedan
  // "iguales" entre si (undefined === undefined) y se descartan todas
  // despues de la primera -- exactamente el freeze que se reportaba.
  private searchChanged = new Subject<string>();

  constructor(
    private customerService: CustomerService,
    private businessConfigService: BusinessConfigService,
    private loyaltyService: LoyaltyService,
    private authService: AuthService,
    private permissionService: PermissionService,
    private snackBar: MatSnackBar,
  ) {
    this.businessConfigService.obtener().subscribe(cfg => (this.business = cfg));
    this.loyaltyService.getConfig().subscribe(cfg => {
      this.descripcionRecompensa = cfg.descripcionRecompensa || 'Recompensa';
      this.sellosNecesarios = cfg.sellosNecesarios;
    });
    this.searchChanged.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.pageIndex = 0;
      this.load();
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.customerService.searchPaged({
      search: this.search.trim() || undefined,
      sellosMin: this.sellosMin,
      recompensa: this.filtroRecompensa !== 'todos' ? this.filtroRecompensa : undefined,
      inactividad: this.filtroInactividad !== 'todos' ? this.filtroInactividad : undefined,
      sortBy: this.sortBy,
      sortDir: this.sortDir,
      page: this.pageIndex,
      size: this.pageSize,
    }).subscribe({
      next: page => {
        this.customers = page.content;
        this.totalElements = page.totalElements;
        this.loading = false;
      },
      error: (err: Error) => { this.loading = false; this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }); },
    });
  }

  onSearchChange(): void {
    this.searchChanged.next(this.search);
  }

  applyFilters(): void {
    this.pageIndex = 0;
    this.load();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  onSortChange(sort: Sort): void {
    this.sortBy = sort.direction ? sort.active : 'id';
    this.sortDir = sort.direction === 'desc' ? 'desc' : 'asc';
    this.pageIndex = 0;
    this.load();
  }

  limpiarFiltros(): void {
    this.search = '';
    this.sellosMin = null;
    this.filtroRecompensa = 'todos';
    this.filtroInactividad = 'todos';
    this.pageIndex = 0;
    this.load();
  }

  enviarWhatsapp(customer: Customer): void {
    window.open(buildWhatsappLink(customer, this.business.nombre, this.business.mensajeRecordatorioWhatsapp), '_blank');
  }

  toggleStatus(customer: Customer): void {
    this.customerService.update(customer.id, { estado: !customer.estado }).subscribe({
      next: () => { customer.estado = !customer.estado; this.snackBar.open('Estado actualizado', '', { duration: 2000 }); },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
  }

  formatId(id: number): string {
    return formatCodigo(id);
  }

  get puedeEliminar(): boolean {
    return this.authService.hasRole(['ADMIN']) || this.permissionService.canDelete('CLIENTES');
  }

  get puedeEditar(): boolean {
    return this.authService.hasRole(['ADMIN']) || this.permissionService.canEdit('CLIENTES');
  }

  eliminar(customer: Customer): void {
    if (!confirm(`¿Eliminar a ${customer.nombre} ${customer.apellido}? Esto lo dará de baja del sistema.`)) return;
    this.customerService.delete(customer.id).subscribe({
      next: () => {
        this.snackBar.open('Cliente eliminado', '', { duration: 2500 });
        this.load();
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
  }
}
