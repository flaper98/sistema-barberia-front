import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { CommissionsDashboardComponent } from './commissions-dashboard/commissions-dashboard.component';
import { RegistrarPropinaDialogComponent } from './registrar-propina-dialog/registrar-propina-dialog.component';
import { RegistrarDescuentoDialogComponent } from './registrar-descuento-dialog/registrar-descuento-dialog.component';

const routes: Routes = [{ path: '', component: CommissionsDashboardComponent }];

@NgModule({
  declarations: [CommissionsDashboardComponent, RegistrarPropinaDialogComponent, RegistrarDescuentoDialogComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class CommissionsModule {}
