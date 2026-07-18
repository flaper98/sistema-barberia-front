import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { MainLayoutComponent } from './main-layout.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { ChangePasswordDialogComponent } from '../navbar/change-password-dialog/change-password-dialog.component';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard',    loadChildren: () => import('../../features/dashboard/dashboard.module').then(m => m.DashboardModule),         canActivate: [RoleGuard], data: { modulo: 'DASHBOARD' } },
      { path: 'customers',   loadChildren: () => import('../../features/customers/customers.module').then(m => m.CustomersModule),          canActivate: [RoleGuard], data: { modulo: 'CLIENTES' } },
      { path: 'workers',     loadChildren: () => import('../../features/workers/workers.module').then(m => m.WorkersModule),                canActivate: [RoleGuard], data: { modulo: 'BARBEROS' } },
      { path: 'appointments', loadChildren: () => import('../../features/appointments/appointments.module').then(m => m.AppointmentsModule), canActivate: [RoleGuard], data: { modulo: 'CITAS' } },
      { path: 'sales',       loadChildren: () => import('../../features/sales/sales.module').then(m => m.SalesModule),                      canActivate: [RoleGuard], data: { modulo: 'VENTAS' } },
      { path: 'products',    loadChildren: () => import('../../features/products/products.module').then(m => m.ProductsModule),             canActivate: [RoleGuard], data: { modulo: 'PRODUCTOS' } },
      { path: 'inventory',   loadChildren: () => import('../../features/inventory/inventory.module').then(m => m.InventoryModule),           canActivate: [RoleGuard], data: { modulo: 'INVENTARIO' } },
      { path: 'services',    loadChildren: () => import('../../features/services-catalog/services-catalog.module').then(m => m.ServicesCatalogModule), canActivate: [RoleGuard], data: { modulo: 'SERVICIOS' } },
      { path: 'finance',     loadChildren: () => import('../../features/finance/finance.module').then(m => m.FinanceModule),     canActivate: [RoleGuard], data: { modulo: 'FINANZAS' } },
      { path: 'loyalty',     loadChildren: () => import('../../features/loyalty/loyalty.module').then(m => m.LoyaltyModule),                 canActivate: [RoleGuard], data: { modulo: 'FIDELIZACION' } },
      { path: 'reports',     loadChildren: () => import('../../features/reports/reports.module').then(m => m.ReportsModule),     canActivate: [RoleGuard], data: { modulo: 'REPORTES' } },
      { path: 'settings',    loadChildren: () => import('../../features/settings/settings.module').then(m => m.SettingsModule),  canActivate: [RoleGuard], data: { modulo: 'CONFIGURACION' } },
      { path: 'users',       loadChildren: () => import('../../features/users/users.module').then(m => m.UsersModule),          canActivate: [RoleGuard], data: { roles: ['ADMIN'] } },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  declarations: [MainLayoutComponent, SidebarComponent, NavbarComponent, ChangePasswordDialogComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class MainLayoutModule {}
