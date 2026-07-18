import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { QuickSaleComponent } from './quick-sale/quick-sale.component';
import { SaleListComponent } from './sale-list/sale-list.component';
import { SaleReceiptComponent } from './sale-receipt/sale-receipt.component';
import { ConfirmarVentaDialogComponent } from './confirmar-venta-dialog/confirmar-venta-dialog.component';
import { EditarVentaDialogComponent } from './editar-venta-dialog/editar-venta-dialog.component';

const routes: Routes = [
  { path: 'quick', component: QuickSaleComponent },
  { path: 'list',  component: SaleListComponent },
  { path: ':id/receipt', component: SaleReceiptComponent },
  { path: '', redirectTo: 'list', pathMatch: 'full' },
];

@NgModule({
  declarations: [QuickSaleComponent, SaleListComponent, SaleReceiptComponent, ConfirmarVentaDialogComponent, EditarVentaDialogComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class SalesModule {}
