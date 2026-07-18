import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product, StockMovementType } from '../../../core/models/product.model';
import { ProductService } from '../../../data/repositories/product.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({ selector: 'app-movement-form', standalone: false, templateUrl: './movement-form.component.html' })
export class MovementFormComponent implements OnInit {
  form!: FormGroup; products: Product[] = []; saving = false;
  movTypes: StockMovementType[] = ['ENTRADA', 'SALIDA', 'AJUSTE'];

  constructor(private fb: FormBuilder, private router: Router, private productService: ProductService, private authService: AuthService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.productService.getAll().subscribe({
      next: p => { this.products = p.filter(pr => pr.estado); },
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });
    this.form = this.fb.group({
      productoId: [null, Validators.required],
      tipoMovimiento: ['ENTRADA', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      motivo: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const v = this.form.value;
    const user = this.authService.currentUser!;
    this.productService.registerMovement(v.productoId, v.tipoMovimiento, v.cantidad, v.motivo, user.id, `${user.nombre} ${user.apellido}`).subscribe({
      next: () => { this.snackBar.open('Movimiento registrado', '', { duration: 2500 }); this.router.navigate(['/inventory']); },
      error: (err: Error) => { this.saving = false; this.snackBar.open(err.message, 'Cerrar', { duration: 3000 }); },
    });
  }

  cancel(): void { this.router.navigate(['/inventory']); }
}
