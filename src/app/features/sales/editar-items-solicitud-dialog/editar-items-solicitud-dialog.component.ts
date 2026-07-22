import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { Sale, SaleItem } from '../../../core/models/sale.model';
import { BarberService } from '../../../core/models/service.model';
import { Product } from '../../../core/models/product.model';
import { Paquete } from '../../../core/models/paquete.model';
import { SaleService } from '../../../data/repositories/sale.service';
import { ServiceCatalogService } from '../../../data/repositories/service-catalog.service';
import { ProductService } from '../../../data/repositories/product.service';
import { PaqueteService } from '../../../data/repositories/paquete.service';
import { matchesSearch } from '../../../core/utils/search.util';

// Version reducida de editar-venta-dialog, solo para que el barbero agregue
// o quite items de SU PROPIA solicitud mientras sigue PENDIENTE -- no toca
// cliente, metodo de pago ni barbero (eso lo asigna recepcion al cobrar).
@Component({
  selector: 'app-editar-items-solicitud-dialog',
  standalone: false,
  templateUrl: './editar-items-solicitud-dialog.component.html',
  styleUrls: ['./editar-items-solicitud-dialog.component.scss'],
})
export class EditarItemsSolicitudDialogComponent implements OnInit {
  loading = true;
  saving = false;

  items: SaleItem[];
  services: BarberService[] = [];
  products: Product[] = [];
  packages: Paquete[] = [];
  searchItem = '';
  itemTab = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public sale: Sale,
    private dialogRef: MatDialogRef<EditarItemsSolicitudDialogComponent>,
    private saleService: SaleService,
    private serviceCatalog: ServiceCatalogService,
    private productService: ProductService,
    private paqueteService: PaqueteService,
    private snackBar: MatSnackBar,
  ) {
    this.items = sale.items.map(i => ({ ...i }));
  }

  ngOnInit(): void {
    forkJoin({
      services: this.serviceCatalog.getActive(),
      products: this.productService.getAll(),
      packages: this.paqueteService.getActivos(),
    }).subscribe({
      next: ({ services, products, packages }) => {
        this.services = services;
        this.products = products.filter(p => p.estado && p.stockActual > 0);
        this.packages = packages;
        this.loading = false;
      },
      error: (err: Error) => {
        this.loading = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  get filteredServices(): BarberService[] {
    if (!this.searchItem) return this.services;
    return this.services.filter(s => matchesSearch(this.searchItem, s.nombre));
  }

  get filteredProducts(): Product[] {
    if (!this.searchItem) return this.products;
    return this.products.filter(p => matchesSearch(this.searchItem, p.nombre));
  }

  get filteredPackages(): Paquete[] {
    if (!this.searchItem) return this.packages;
    return this.packages.filter(p => matchesSearch(this.searchItem, p.nombre));
  }

  addService(service: BarberService): void {
    const existing = this.items.find(i => i.tipo === 'SERVICIO' && i.itemId === service.id);
    if (existing) {
      existing.cantidad += 1;
      existing.subtotal = existing.precio * existing.cantidad;
    } else {
      this.items.push({ tipo: 'SERVICIO', itemId: service.id, nombre: service.nombre, precio: service.precio, cantidad: 1, subtotal: service.precio });
    }
  }

  addPackage(paquete: Paquete): void {
    const existing = this.items.find(i => i.tipo === 'PAQUETE' && i.itemId === paquete.id);
    if (existing) {
      existing.cantidad += 1;
      existing.subtotal = existing.precio * existing.cantidad;
    } else {
      this.items.push({ tipo: 'PAQUETE', itemId: paquete.id, nombre: paquete.nombre, precio: paquete.precio, cantidad: 1, subtotal: paquete.precio });
    }
  }

  addProduct(product: Product): void {
    const existing = this.items.find(i => i.tipo === 'PRODUCTO' && i.itemId === product.id);
    if (existing) {
      if (existing.cantidad < product.stockActual) {
        existing.cantidad += 1;
        existing.subtotal = existing.precio * existing.cantidad;
      } else {
        this.snackBar.open('Stock insuficiente', '', { duration: 2000 });
      }
    } else {
      this.items.push({ tipo: 'PRODUCTO', itemId: product.id, nombre: product.nombre, precio: product.precioVenta, cantidad: 1, subtotal: product.precioVenta });
    }
  }

  increaseItem(item: SaleItem): void {
    item.cantidad += 1;
    item.subtotal = item.precio * item.cantidad;
  }

  decreaseItem(item: SaleItem): void {
    if (item.cantidad > 1) {
      item.cantidad -= 1;
      item.subtotal = item.precio * item.cantidad;
    } else {
      this.removeItem(item);
    }
  }

  removeItem(item: SaleItem): void {
    const idx = this.items.indexOf(item);
    if (idx > -1) this.items.splice(idx, 1);
  }

  get itemCount(): number {
    return this.items.reduce((a, i) => a + i.cantidad, 0);
  }

  iconFor(tipo: string): string {
    return tipo === 'SERVICIO' ? 'spa' : tipo === 'PAQUETE' ? 'redeem' : 'inventory_2';
  }

  get subtotal(): number {
    return this.items.reduce((a, i) => a + i.subtotal, 0);
  }

  // El descuento no se edita acá -- lo hereda de la solicitud original (lo
  // asigna recepcion), solo se muestra para que el barbero vea el total real.
  get total(): number {
    return Math.max(0, this.subtotal - (this.sale.descuento || 0));
  }

  get puedeGuardar(): boolean {
    return !this.saving && this.items.length > 0;
  }

  guardar(): void {
    if (!this.items.length) return;
    this.saving = true;
    this.saleService.updateItems(
      this.sale.id,
      this.items.map(({ tipo, itemId, nombre, precio, cantidad }) => ({ tipo, itemId, nombre, precio, cantidad })),
    ).subscribe({
      next: (updated) => {
        this.snackBar.open(`Solicitud #${updated.id} actualizada`, '', { duration: 3000, panelClass: 'success-snack' });
        this.dialogRef.close(updated);
      },
      error: (err: Error) => {
        this.saving = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
