import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { CustomerListComponent } from './customer-list/customer-list.component';
import { CustomerFormComponent } from './customer-form/customer-form.component';
import { CustomerDetailComponent } from './customer-detail/customer-detail.component';

const routes: Routes = [
  { path: '',         component: CustomerListComponent },
  { path: 'new',      component: CustomerFormComponent },
  { path: ':id',      component: CustomerDetailComponent },
  { path: ':id/edit', component: CustomerFormComponent },
];

@NgModule({
  declarations: [CustomerListComponent, CustomerFormComponent, CustomerDetailComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class CustomersModule {}
