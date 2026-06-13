import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { FinanceDashboardComponent } from './finance-dashboard/finance-dashboard.component';

const routes: Routes = [{ path: '', component: FinanceDashboardComponent }];

@NgModule({
  declarations: [FinanceDashboardComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class FinanceModule {}
