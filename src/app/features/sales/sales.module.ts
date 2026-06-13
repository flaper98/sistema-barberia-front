import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { QuickSaleComponent } from './quick-sale/quick-sale.component';
import { SaleListComponent } from './sale-list/sale-list.component';

const routes: Routes = [
  { path: 'quick', component: QuickSaleComponent },
  { path: 'list',  component: SaleListComponent },
  { path: '', redirectTo: 'quick', pathMatch: 'full' },
];

@NgModule({
  declarations: [QuickSaleComponent, SaleListComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class SalesModule {}
