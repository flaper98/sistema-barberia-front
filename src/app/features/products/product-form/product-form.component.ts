import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../data/repositories/product.service';

@Component({ selector: 'app-product-form', standalone: false, templateUrl: './product-form.component.html' })
export class ProductFormComponent implements OnInit {
  form!: FormGroup; isEdit = false; loading = false; saving = false;
  categories = ['SHAMPOO','POMADA','ACEITE','NAVAJA','ACCESORIO','OTRO'];

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private router: Router, private svc: ProductService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!id && !isNaN(+id);
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      categoria: ['', Validators.required],
      precioVenta: [0, [Validators.required, Validators.min(0)]],
      precioCompra: [0, [Validators.required, Validators.min(0)]],
      stockActual: [0, [Validators.required, Validators.min(0)]],
      stockMinimo: [5, [Validators.required, Validators.min(0)]],
      descripcion: [''],
      estado: [true],
    });
    if (this.isEdit) {
      this.loading = true;
      this.svc.getById(+id!).subscribe({ next: p => { this.form.patchValue(p); this.loading = false; }, error: () => this.router.navigate(['/products']) });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const id = this.route.snapshot.paramMap.get('id');
    const op$ = this.isEdit ? this.svc.update(+id!, this.form.value) : this.svc.create(this.form.value);
    op$.subscribe({ next: () => { this.snackBar.open('Producto guardado', '', { duration: 2500 }); this.router.navigate(['/products']); }, error: () => { this.saving = false; } });
  }

  cancel(): void { this.router.navigate(['/products']); }
}
