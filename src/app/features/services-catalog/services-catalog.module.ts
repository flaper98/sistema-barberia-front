import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ServiceListComponent } from './service-list/service-list.component';
import { ServiceFormComponent } from './service-form/service-form.component';
import { PaqueteDialogComponent } from './paquete-dialog/paquete-dialog.component';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  { path: '',    component: ServiceListComponent },
  { path: 'new', component: ServiceFormComponent, canActivate: [RoleGuard], data: { modulo: 'SERVICIOS', requiereEdicion: true } },
  { path: ':id', component: ServiceFormComponent, canActivate: [RoleGuard], data: { modulo: 'SERVICIOS', requiereEdicion: true } },
];

@NgModule({
  declarations: [ServiceListComponent, ServiceFormComponent, PaqueteDialogComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ServicesCatalogModule {}
