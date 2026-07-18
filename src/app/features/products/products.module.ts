import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ProductListComponent } from './product-list/product-list.component';
import { ProductFormComponent } from './product-form/product-form.component';
import { CategoriaDialogComponent } from './categoria-dialog/categoria-dialog.component';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  { path: '',       component: ProductListComponent },
  { path: 'new',    component: ProductFormComponent, canActivate: [RoleGuard], data: { modulo: 'PRODUCTOS', requiereEdicion: true } },
  { path: ':id',    component: ProductFormComponent, canActivate: [RoleGuard], data: { modulo: 'PRODUCTOS', requiereEdicion: true } },
];

@NgModule({
  declarations: [ProductListComponent, ProductFormComponent, CategoriaDialogComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ProductsModule {}
