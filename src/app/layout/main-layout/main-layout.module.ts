import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { MainLayoutComponent } from './main-layout.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard',    loadChildren: () => import('../../features/dashboard/dashboard.module').then(m => m.DashboardModule) },
      { path: 'customers',   loadChildren: () => import('../../features/customers/customers.module').then(m => m.CustomersModule) },
      { path: 'workers',     loadChildren: () => import('../../features/workers/workers.module').then(m => m.WorkersModule) },
      { path: 'appointments', loadChildren: () => import('../../features/appointments/appointments.module').then(m => m.AppointmentsModule) },
      { path: 'sales',       loadChildren: () => import('../../features/sales/sales.module').then(m => m.SalesModule) },
      { path: 'products',    loadChildren: () => import('../../features/products/products.module').then(m => m.ProductsModule) },
      { path: 'inventory',   loadChildren: () => import('../../features/inventory/inventory.module').then(m => m.InventoryModule) },
      { path: 'services',    loadChildren: () => import('../../features/services-catalog/services-catalog.module').then(m => m.ServicesCatalogModule) },
      { path: 'finance',     loadChildren: () => import('../../features/finance/finance.module').then(m => m.FinanceModule),     canActivate: [RoleGuard], data: { roles: ['ADMIN', 'CASHIER'] } },
      { path: 'loyalty',     loadChildren: () => import('../../features/loyalty/loyalty.module').then(m => m.LoyaltyModule) },
      { path: 'reports',     loadChildren: () => import('../../features/reports/reports.module').then(m => m.ReportsModule),     canActivate: [RoleGuard], data: { roles: ['ADMIN'] } },
      { path: 'settings',    loadChildren: () => import('../../features/settings/settings.module').then(m => m.SettingsModule),  canActivate: [RoleGuard], data: { roles: ['ADMIN'] } },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  declarations: [MainLayoutComponent, SidebarComponent, NavbarComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class MainLayoutModule {}
