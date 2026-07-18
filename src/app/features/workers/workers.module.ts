import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { WorkerListComponent } from './worker-list/worker-list.component';
import { WorkerFormComponent } from './worker-form/worker-form.component';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  { path: '',       component: WorkerListComponent },
  { path: 'new',    component: WorkerFormComponent, canActivate: [RoleGuard], data: { modulo: 'BARBEROS', requiereEdicion: true } },
  { path: ':id',    component: WorkerFormComponent, canActivate: [RoleGuard], data: { modulo: 'BARBEROS', requiereEdicion: true } },
];

@NgModule({
  declarations: [WorkerListComponent, WorkerFormComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class WorkersModule {}
