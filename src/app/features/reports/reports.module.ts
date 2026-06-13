import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ReportsDashboardComponent } from './reports-dashboard/reports-dashboard.component';

const routes: Routes = [{ path: '', component: ReportsDashboardComponent }];

@NgModule({
  declarations: [ReportsDashboardComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ReportsModule {}
