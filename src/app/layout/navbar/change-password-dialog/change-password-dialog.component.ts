import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsuarioService } from '../../../data/repositories/usuario.service';

function passwordsCoinciden(control: AbstractControl): ValidationErrors | null {
  const nueva = control.get('newPassword')?.value;
  const confirmar = control.get('confirmPassword')?.value;
  return nueva && confirmar && nueva !== confirmar ? { noCoincide: true } : null;
}

@Component({
  selector: 'app-change-password-dialog',
  standalone: false,
  templateUrl: './change-password-dialog.component.html',
})
export class ChangePasswordDialogComponent {
  form: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
  ) {
    this.form = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordsCoinciden },
    );
  }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const { currentPassword, newPassword } = this.form.value;
    this.usuarioService.cambiarMiPassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Contraseña actualizada correctamente', '', { duration: 2500 });
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
