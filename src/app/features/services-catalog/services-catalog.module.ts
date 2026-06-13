import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ServiceListComponent } from './service-list/service-list.component';
import { ServiceFormComponent } from './service-form/service-form.component';

const routes: Routes = [
  { path: '',    component: ServiceListComponent },
  { path: 'new', component: ServiceFormComponent },
  { path: ':id', component: ServiceFormComponent },
];

@NgModule({
  declarations: [ServiceListComponent, ServiceFormComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ServicesCatalogModule {}
