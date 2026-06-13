import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { LoyaltyDashboardComponent } from './loyalty-dashboard/loyalty-dashboard.component';

const routes: Routes = [{ path: '', component: LoyaltyDashboardComponent }];

@NgModule({
  declarations: [LoyaltyDashboardComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class LoyaltyModule {}
