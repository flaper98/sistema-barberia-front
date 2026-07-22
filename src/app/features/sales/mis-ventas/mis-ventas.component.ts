import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Sale } from '../../../core/models/sale.model';
import { SaleService } from '../../../data/repositories/sale.service';
import { AuthService } from '../../../core/auth/auth.service';
import { EditarItemsSolicitudDialogComponent } from '../editar-items-solicitud-dialog/editar-items-solicitud-dialog.component';
import { toLocalDateStr } from '../../../core/utils/date.util';

/**
 * Vista del propio barbero de sus ventas -- usa GET /api/sales/by-worker/{id},
 * el unico endpoint de historial de ventas al que un BARBER tiene acceso
 * (a proposito: el backend no deja que un barbero lea el historial general,
 * para que no vea las ventas/comisiones de sus companeros -- ver
 * sidebar.component.ts). Es informativa (sin eliminar/cobrar), salvo por
 * una excepcion: mientras una solicitud propia sigue PENDIENTE, puede
 * agregar/quitar items (ver editarItems()) por si el cliente pide algo mas
 * a mitad de la atencion -- todo lo demas (cliente, metodo de pago) lo
 * sigue asignando recepcion al cobrar.
 *
 * No muestra el total de cada venta (esa plata no es toda del barbero) --
 * en su lugar, cada fila trae calculada la comision que le corresponde a
 * ESE barbero de ESA venta (ver VentaServiceImpl.listarPorBarbero).
 */
@Component({
  selector: 'app-mis-ventas',
  standalone: false,
  templateUrl: './mis-ventas.component.html',
})
export class MisVentasComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['id', 'fecha', 'clienteNombre', 'tipoVenta', 'comisionCalculada', 'metodoPago', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Sale>([]);
  loading = true;

  // "Su reporte": puede elegir cualquier rango -- por defecto siempre hoy.
  fechaDesde: Date = new Date();
  fechaHasta: Date = new Date();

  private barberoId: number | null = null;

  private readonly metodoPagoLabels: Record<string, string> = {
    EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transferencia',
    YAPE: 'Yape', PLIN: 'Plin', MIXTO: 'Mixto',
  };

  metodoPagoLabel(sale: Sale): string {
    if (!sale.metodoPago) return 'Sin asignar';
    return this.metodoPagoLabels[sale.metodoPago] ?? sale.metodoPago;
  }

  metodoPagoDetalle(sale: Sale): string {
    if (!sale.pagos || sale.pagos.length <= 1) return '';
    return sale.pagos.map(p => `${this.metodoPagoLabels[p.metodoPago] ?? p.metodoPago}: S/ ${p.monto.toFixed(2)}`).join(' + ');
  }

  get totalComisiones(): number {
    return this.dataSource.data
      .filter(s => s.estado === 'COMPLETADA')
      .reduce((acc, s) => acc + (s.comisionCalculada ?? 0), 0);
  }

  constructor(
    private saleService: SaleService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.barberoId = this.authService.currentUser?.barberoId ?? null;
    if (!this.barberoId) {
      this.loading = false;
      return;
    }
    this.cargar();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onFechaChange(): void {
    this.cargar();
  }

  private cargar(): void {
    if (!this.barberoId) return;
    this.loading = true;
    this.saleService.getByWorker(this.barberoId, toLocalDateStr(this.fechaDesde), toLocalDateStr(this.fechaHasta), 0, 100).subscribe({
      next: sales => {
        this.dataSource.data = sales;
        this.loading = false;
      },
      error: (err: Error) => {
        this.loading = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  editarItems(sale: Sale): void {
    // Ancho relativo al viewport (con tope para desktop) -- un ancho fijo
    // como "600px" se corta en pantallas de celular, que es donde el
    // barbero realmente usa esto.
    const ref = this.dialog.open(EditarItemsSolicitudDialogComponent, {
      width: '94vw', maxWidth: '440px', maxHeight: '88vh', data: sale,
    });
    ref.afterClosed().subscribe((updated: Sale | null) => {
      if (!updated) return;
      const idx = this.dataSource.data.findIndex(s => s.id === updated.id);
      if (idx > -1) {
        const copy = [...this.dataSource.data];
        copy[idx] = updated;
        this.dataSource.data = copy;
      }
    });
  }
}
