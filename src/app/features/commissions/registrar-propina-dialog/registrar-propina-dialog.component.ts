import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommissionService } from '../../../data/repositories/commission.service';

export interface RegistrarPropinaDialogData {
  barberoId: number;
  barberoNombre: string;
}

@Component({
  selector: 'app-registrar-propina-dialog',
  standalone: false,
  templateUrl: './registrar-propina-dialog.component.html',
})
export class RegistrarPropinaDialogComponent {
  saving = false;
  monto: number | null = null;
  notas = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RegistrarPropinaDialogData,
    private dialogRef: MatDialogRef<RegistrarPropinaDialogComponent>,
    private commissionService: CommissionService,
    private snackBar: MatSnackBar,
  ) {}

  get puedeGuardar(): boolean {
    return !this.saving && !!this.monto && this.monto > 0;
  }

  guardar(): void {
    if (!this.monto) return;
    this.saving = true;
    this.commissionService.registrarPropina({
      barberoId: this.data.barberoId,
      monto: this.monto,
      notas: this.notas.trim() || undefined,
    }).subscribe({
      next: () => {
        this.snackBar.open('Propina registrada', '', { duration: 2500, panelClass: 'success-snack' });
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
