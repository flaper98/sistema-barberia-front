import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../data/repositories/product.service';
import { CategoriaProductoService } from '../../../data/repositories/categoria-producto.service';

@Component({ selector: 'app-product-form', standalone: false, templateUrl: './product-form.component.html' })
export class ProductFormComponent implements OnInit {
  form!: FormGroup; isEdit = false; loading = false; saving = false;
  categories: string[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private svc: ProductService,
    private categoriaService: CategoriaProductoService,
    private snackBar: MatSnackBar,
  ) {}

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

    this.categoriaService.getActivas().subscribe({
      next: cats => {
        this.categories = cats.map(c => c.nombre);
        const actual = this.form.get('categoria')?.value;
        if (actual && !this.categories.includes(actual)) this.categories.push(actual);
      },
      error: () => {},
    });

    if (this.isEdit) {
      this.loading = true;
      this.svc.getById(+id!).subscribe({
        next: p => {
          this.form.patchValue(p);
          if (p.categoria && !this.categories.includes(p.categoria)) this.categories.push(p.categoria);
          this.loading = false;
        },
        error: (err: Error) => {
          this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
          this.router.navigate(['/products']);
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const id = this.route.snapshot.paramMap.get('id');
    const op$ = this.isEdit ? this.svc.update(+id!, this.form.value) : this.svc.create(this.form.value);
    op$.subscribe({
      next: () => { this.snackBar.open('Producto guardado', '', { duration: 2500 }); this.router.navigate(['/products']); },
      error: (err: Error) => { this.saving = false; this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }); },
    });
  }

  cancel(): void { this.router.navigate(['/products']); }
}
