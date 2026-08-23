import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ServiceCatalogService } from '../../../data/repositories/service-catalog.service';
import { ProductService } from '../../../data/repositories/product.service';
import { Product } from '../../../core/models/product.model';

@Component({ selector: 'app-service-form', standalone: false, templateUrl: './service-form.component.html' })
export class ServiceFormComponent implements OnInit {
  form!: FormGroup; isEdit = false; loading = false; saving = false;
  categories = ['CORTE','BARBA','TRATAMIENTO','COLOR','COMBO'];
  products: Product[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private svc: ServiceCatalogService,
    private productService: ProductService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!id && !isNaN(+id);
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      categoria: ['CORTE', Validators.required],
      precio: [0, [Validators.required, Validators.min(0)]],
      precioVariable: [false],
      duracionMinutos: [30, [Validators.required, Validators.min(5)]],
      descripcion: [''],
      estado: [true],
      cortesias: this.fb.array([]),
    });

    this.productService.getAll().subscribe({
      next: products => (this.products = products.filter(p => p.estado)),
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });

    if (this.isEdit) {
      this.loading = true;
      this.svc.getById(+id!).subscribe({
        next: s => {
          this.form.patchValue(s);
          (s.cortesias ?? []).forEach(c => this.addCortesia(c.productoId, c.cantidad));
          this.loading = false;
        },
        error: (err: Error) => {
          this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
          this.router.navigate(['/services']);
        },
      });
    }
  }

  get cortesiasArray(): FormArray {
    return this.form.get('cortesias') as FormArray;
  }

  addCortesia(productoId: number | null = null, cantidad = 1): void {
    this.cortesiasArray.push(this.fb.group({
      productoId: [productoId, Validators.required],
      cantidad: [cantidad, [Validators.required, Validators.min(1)]],
    }));
  }

  removeCortesia(index: number): void {
    this.cortesiasArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const id = this.route.snapshot.paramMap.get('id');
    const op$ = this.isEdit ? this.svc.update(+id!, this.form.value) : this.svc.create(this.form.value);
    op$.subscribe({
      next: () => { this.snackBar.open('Servicio guardado', '', { duration: 2500 }); this.router.navigate(['/services']); },
      error: (err: Error) => { this.saving = false; this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }); },
    });
  }

  cancel(): void { this.router.navigate(['/services']); }
}
