import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ProductListComponent } from './product-list/product-list.component';
import { ProductFormComponent } from './product-form/product-form.component';

const routes: Routes = [
  { path: '',       component: ProductListComponent },
  { path: 'new',    component: ProductFormComponent },
  { path: ':id',    component: ProductFormComponent },
];

@NgModule({
  declarations: [ProductListComponent, ProductFormComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ProductsModule {}
