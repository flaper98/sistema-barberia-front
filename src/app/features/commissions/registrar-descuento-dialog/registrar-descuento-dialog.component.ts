import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product } from '../../../core/models/product.model';
import { ProductService } from '../../../data/repositories/product.service';
import { CommissionService } from '../../../data/repositories/commission.service';
import { matchesSearch } from '../../../core/utils/search.util';

export interface RegistrarDescuentoDialogData {
  barberoId: number;
  barberoNombre: string;
}

// Registra el consumo personal de un barbero (ej. una gaseosa) -- descuenta
// el stock de verdad (movimiento tipo CONSUMO) y resta el monto de su
// comision, al precio de venta del producto.
@Component({
  selector: 'app-registrar-descuento-dialog',
  standalone: false,
  templateUrl: './registrar-descuento-dialog.component.html',
  styleUrls: ['./registrar-descuento-dialog.component.scss'],
})
export class RegistrarDescuentoDialogComponent implements OnInit {
  saving = false;
  loading = true;
  products: Product[] = [];
  searchProduct = '';
  selectedProduct: Product | null = null;
  cantidad = 1;
  motivo = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RegistrarDescuentoDialogData,
    private dialogRef: MatDialogRef<RegistrarDescuentoDialogComponent>,
    private productService: ProductService,
    private commissionService: CommissionService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.productService.getAll().subscribe({
      next: products => {
        this.products = products.filter(p => p.estado && p.stockActual > 0);
        this.loading = false;
      },
      error: (err: Error) => {
        this.loading = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  get filteredProducts(): Product[] {
    if (!this.searchProduct) return this.products;
    return this.products.filter(p => matchesSearch(this.searchProduct, p.nombre));
  }

  get montoEstimado(): number {
    return this.selectedProduct ? this.selectedProduct.precioVenta * this.cantidad : 0;
  }

  seleccionar(p: Product): void {
    this.selectedProduct = p;
    this.cantidad = 1;
  }

  get puedeGuardar(): boolean {
    return !this.saving && !!this.selectedProduct
      && this.cantidad > 0 && this.cantidad <= this.selectedProduct.stockActual;
  }

  guardar(): void {
    if (!this.selectedProduct) return;
    this.saving = true;
    this.commissionService.registrarConsumo({
      barberoId: this.data.barberoId,
      productoId: this.selectedProduct.id,
      cantidad: this.cantidad,
      motivo: this.motivo.trim() || undefined,
    }).subscribe({
      next: () => {
        this.snackBar.open('Consumo registrado', '', { duration: 2500, panelClass: 'success-snack' });
        this.dialogRef.close(true);
      },
      error: (err: Error) => {
        this.saving = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
