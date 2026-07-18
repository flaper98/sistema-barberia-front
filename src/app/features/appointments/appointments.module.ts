import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { AppointmentListComponent } from './appointment-list/appointment-list.component';
import { AppointmentFormComponent } from './appointment-form/appointment-form.component';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  { path: '',      component: AppointmentListComponent },
  { path: 'new',   component: AppointmentFormComponent, canActivate: [RoleGuard], data: { modulo: 'CITAS', requiereEdicion: true } },
  { path: ':id',   component: AppointmentFormComponent, canActivate: [RoleGuard], data: { modulo: 'CITAS', requiereEdicion: true } },
];

@NgModule({
  declarations: [AppointmentListComponent, AppointmentFormComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class AppointmentsModule {}
