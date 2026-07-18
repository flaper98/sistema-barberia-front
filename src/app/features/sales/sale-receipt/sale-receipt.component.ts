import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { Sale } from '../../../core/models/sale.model';
import { BusinessConfig, DEFAULT_BUSINESS_CONFIG } from '../../../core/models/business-config.model';
import { SaleService } from '../../../data/repositories/sale.service';
import { BusinessConfigService } from '../../../data/repositories/business-config.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-sale-receipt',
  standalone: false,
  templateUrl: './sale-receipt.component.html',
  styleUrls: ['./sale-receipt.component.scss'],
})
export class SaleReceiptComponent implements OnInit, OnDestroy {
  sale: Sale | null = null;
  business: BusinessConfig = DEFAULT_BUSINESS_CONFIG;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private saleService: SaleService,
    private businessConfigService: BusinessConfigService,
    private snackBar: MatSnackBar,
    private titleService: Title,
  ) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    forkJoin({
      sale: this.saleService.getById(id),
      business: this.businessConfigService.obtener(),
    }).subscribe({
      next: ({ sale, business }) => {
        this.sale = sale;
        this.business = business;
        this.loading = false;
        this.actualizarTituloDocumento();
      },
      error: (err: Error) => {
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
        this.router.navigate(['/sales/list']);
      },
    });
  }

  ngOnDestroy(): void {
    this.titleService.setTitle(environment.appName);
  }

  /** El navegador usa document.title como nombre sugerido al Imprimir/Guardar como PDF. */
  private actualizarTituloDocumento(): void {
    if (!this.sale) return;
    const cliente = (this.sale.clienteNombre || 'Cliente').replace(/[\\/:*?"<>|]/g, '');
    const fecha = new Date(this.sale.fecha);
    const fechaStr = [
      fecha.getDate().toString().padStart(2, '0'),
      (fecha.getMonth() + 1).toString().padStart(2, '0'),
      fecha.getFullYear(),
    ].join('-');
    this.titleService.setTitle(`Boleta ${cliente} ${fechaStr}`);
  }

  private readonly metodoPagoLabels: Record<string, string> = {
    EFECTIVO: 'Efectivo',
    TARJETA: 'Tarjeta',
    TRANSFERENCIA: 'Transferencia',
    YAPE: 'Yape',
    PLIN: 'Plin',
  };

  get numeroBoleta(): string {
    return this.sale ? this.sale.id.toString().padStart(6, '0') : '';
  }

  get metodoPagoLabel(): string {
    if (!this.sale) return '';
    return this.metodoPagoLabels[this.sale.metodoPago] ?? this.sale.metodoPago;
  }

  imprimir(): void {
    window.print();
  }

  volver(): void {
    this.router.navigate(['/sales/list']);
  }
}
