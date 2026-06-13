import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { SettingsDashboardComponent } from './settings-dashboard/settings-dashboard.component';

const routes: Routes = [{ path: '', component: SettingsDashboardComponent }];

@NgModule({
  declarations: [SettingsDashboardComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class SettingsModule {}
