import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Sale, PaymentMethod } from '../../../core/models/sale.model';
import { SaleService } from '../../../data/repositories/sale.service';

@Component({
  selector: 'app-confirmar-venta-dialog',
  standalone: false,
  templateUrl: './confirmar-venta-dialog.component.html',
  styleUrls: ['./confirmar-venta-dialog.component.scss'],
})
export class ConfirmarVentaDialogComponent {
  saving = false;
  metodoPago: PaymentMethod;

  readonly paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'EFECTIVO',      label: 'Efectivo',      icon: 'payments' },
    { value: 'TARJETA',       label: 'Tarjeta',       icon: 'credit_card' },
    { value: 'YAPE',          label: 'Yape',          icon: 'phone_android' },
    { value: 'PLIN',          label: 'Plin',          icon: 'phone_iphone' },
    { value: 'TRANSFERENCIA', label: 'Transferencia', icon: 'account_balance' },
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public sale: Sale,
    private dialogRef: MatDialogRef<ConfirmarVentaDialogComponent>,
    private saleService: SaleService,
    private snackBar: MatSnackBar,
  ) {
    this.metodoPago = sale.metodoPago;
  }

  confirmar(): void {
    this.saving = true;
    this.saleService.confirm(this.sale.id, this.metodoPago).subscribe({
      next: (updated) => {
        this.snackBar.open(`Venta #${updated.id} cobrada correctamente`, '', { duration: 3000, panelClass: 'success-snack' });
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
