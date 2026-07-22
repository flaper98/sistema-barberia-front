import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { LoyaltyAccount, ReglaFidelizacion } from '../../../core/models/loyalty.model';
import { LoyaltyService } from '../../../data/repositories/loyalty.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { matchesSearch } from '../../../core/utils/search.util';

@Component({ selector: 'app-loyalty-dashboard', standalone: false, templateUrl: './loyalty-dashboard.component.html', styleUrls: ['./loyalty-dashboard.component.scss'] })
export class LoyaltyDashboardComponent implements OnInit {
  // Antes se traia una sola pagina de 50 clientes (ordenados por nombre) y
  // se buscaba/paginaba todo en memoria -- con 1000+ clientes, un cliente
  // recien creado nunca caia en esos primeros 50 y la busqueda tampoco lo
  // encontraba (solo filtraba lo ya cargado). Ahora "Todos los clientes"
  // pagina y busca del lado del servidor, igual que customer-list.
  accounts: LoyaltyAccount[] = [];
  totalElements = 0;
  pageIndex = 0;
  pageSize = 24;
  search = '';
  loading = true;
  activeTab = 0;
  descripcionRecompensa = '';

  // Pestaña "Qué aplica sello" -- que servicios/productos/paquetes suman
  // sello (ver ComisionController/commissions-dashboard, mismo patron para
  // % de comision). Se carga recien al entrar a esa pestaña, no en
  // ngOnInit, porque solo ADMIN/CASHIER/RECEPTION la usan.
  reglasServicios: ReglaFidelizacion[] = [];
  reglasProductos: ReglaFidelizacion[] = [];
  reglasPaquetes: ReglaFidelizacion[] = [];
  filtroReglaServicios = '';
  filtroReglaProductos = '';
  filtroReglaPaquetes = '';
  loadingReglas = false;
  reglasCargadas = false;

  private searchChanged = new Subject<string>();

  constructor(
    private loyaltyService: LoyaltyService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private permissionService: PermissionService,
  ) {
    this.searchChanged.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.pageIndex = 0;
      this.load();
    });
  }

  get puedeEditar(): boolean {
    return this.authService.hasRole(['ADMIN']) || this.permissionService.canEdit('FIDELIZACION');
  }

  // La pestaña "Qué aplica sello" configura el catálogo, no la cuenta de
  // un cliente puntual -- igual criterio que "Tasas de comisión", que
  // tampoco se la muestra al barbero (ver commissions-dashboard).
  get esBarbero(): boolean {
    return this.authService.hasRole(['BARBER']);
  }

  ngOnInit(): void {
    this.loyaltyService.getConfig().subscribe({
      next: cfg => (this.descripcionRecompensa = cfg.descripcionRecompensa || 'Recompensa'),
      error: () => {},
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    const page$ = this.activeTab === 1
      ? this.loyaltyService.getCustomersWithRewardsPaged({ page: this.pageIndex, size: this.pageSize })
      : this.loyaltyService.getAccountsPaged({ search: this.search.trim() || undefined, page: this.pageIndex, size: this.pageSize });

    page$.subscribe({
      next: pageResp => {
        // La pestaña "Con recompensas" todavía no busca del lado del
        // servidor (el endpoint no lo soporta) -- se filtra lo ya cargado,
        // que en la práctica es un conjunto mucho más chico que el total
        // de clientes.
        this.accounts = this.activeTab === 1 && this.search.trim()
          ? pageResp.content.filter(a => matchesSearch(this.search, a.clienteNombre))
          : pageResp.content;
        this.totalElements = pageResp.totalElements;
        this.loading = false;
      },
      error: (err: Error) => { this.loading = false; this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }); },
    });
  }

  onSearchChange(): void {
    this.searchChanged.next(this.search);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  getStampArray(acc: LoyaltyAccount): number[] { return Array.from({ length: acc.sellosNecesarios }, (_, i) => i); }

  redeem(account: LoyaltyAccount): void {
    this.loyaltyService.redeemReward(account.clienteId).subscribe({
      next: (updated) => {
        const idx = this.accounts.findIndex(a => a.clienteId === account.clienteId);
        if (idx > -1) {
          this.accounts[idx] = {
            ...this.accounts[idx],
            sellosActuales: updated.sellosActuales,
            sellosNecesarios: updated.sellosNecesarios,
            recompensasDisponibles: updated.recompensasDisponibles,
          };
        }
        this.snackBar.open('Recompensa canjeada', '', { duration: 2500 });
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 3000 }),
    });
  }

  addStamp(account: LoyaltyAccount): void {
    this.loyaltyService.addStamp(account.clienteId).subscribe({
      next: (updated) => {
        const idx = this.accounts.findIndex(a => a.clienteId === account.clienteId);
        if (idx > -1) {
          this.accounts[idx] = {
            ...this.accounts[idx],
            sellosActuales: updated.sellosActuales,
            sellosNecesarios: updated.sellosNecesarios,
            recompensasDisponibles: updated.recompensasDisponibles,
          };
        }
        this.snackBar.open(updated.mensaje, '', { duration: 2500 });
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 3000 }),
    });
  }

  removeStamp(account: LoyaltyAccount): void {
    if (!confirm(`¿Quitar un sello a ${account.clienteNombre}? Usalo solo para corregir un sello agregado por error.`)) return;
    this.loyaltyService.removeStamp(account.clienteId).subscribe({
      next: (updated) => {
        const idx = this.accounts.findIndex(a => a.clienteId === account.clienteId);
        if (idx > -1) {
          this.accounts[idx] = {
            ...this.accounts[idx],
            sellosActuales: updated.sellosActuales,
            sellosNecesarios: updated.sellosNecesarios,
            recompensasDisponibles: updated.recompensasDisponibles,
          };
        }
        this.snackBar.open(updated.mensaje, '', { duration: 2500 });
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 3000 }),
    });
  }

  onTabChange(idx: number): void {
    this.activeTab = idx;
    if (idx === 2) {
      if (!this.reglasCargadas) this.cargarReglas();
      return;
    }
    this.pageIndex = 0;
    this.load();
  }

  private cargarReglas(): void {
    this.loadingReglas = true;
    this.reglasCargadas = true;
    this.loyaltyService.getReglasServicios().subscribe(r => this.reglasServicios = r);
    this.loyaltyService.getReglasProductos().subscribe(r => this.reglasProductos = r);
    this.loyaltyService.getReglasPaquetes().subscribe({
      next: r => { this.reglasPaquetes = r; this.loadingReglas = false; },
      error: (err: Error) => { this.loadingReglas = false; this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }); },
    });
  }

  get reglasServiciosFiltradas(): ReglaFidelizacion[] {
    return this.reglasServicios.filter(r => matchesSearch(this.filtroReglaServicios, r.nombre));
  }

  get reglasProductosFiltradas(): ReglaFidelizacion[] {
    return this.reglasProductos.filter(r => matchesSearch(this.filtroReglaProductos, r.nombre));
  }

  get reglasPaquetesFiltradas(): ReglaFidelizacion[] {
    return this.reglasPaquetes.filter(r => matchesSearch(this.filtroReglaPaquetes, r.nombre));
  }

  guardarRegla(tipo: 'SERVICIO' | 'PRODUCTO' | 'PAQUETE', item: ReglaFidelizacion, aplica: boolean): void {
    const op$ = tipo === 'SERVICIO' ? this.loyaltyService.actualizarReglaServicio(item.id, aplica)
      : tipo === 'PRODUCTO' ? this.loyaltyService.actualizarReglaProducto(item.id, aplica)
      : this.loyaltyService.actualizarReglaPaquete(item.id, aplica);
    op$.subscribe({
      next: actualizado => {
        item.aplicaFidelizacion = actualizado.aplicaFidelizacion;
        this.snackBar.open(
          `${item.nombre}: ${actualizado.aplicaFidelizacion ? 'ahora suma sello' : 'ya no suma sello'}`,
          '', { duration: 2000, panelClass: 'success-snack' },
        );
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
  }
}
