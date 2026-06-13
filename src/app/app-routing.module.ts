import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { NoAuthGuard } from './core/guards/no-auth.guard';
import { RoleGuard } from './core/guards/role.guard';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  {
    path: 'login',
    canActivate: [NoAuthGuard],
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule),
  },

  // Ruta pública — sin AuthGuard
  {
    path: 'reservar-cita',
    loadChildren: () => import('./features/public-booking/public-booking.module').then(m => m.PublicBookingModule),
  },

  {
    path: '',
    canActivate: [AuthGuard],
    loadChildren: () => import('./layout/main-layout/main-layout.module').then(m => m.MainLayoutModule),
  },

  { path: '**', redirectTo: '/dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
