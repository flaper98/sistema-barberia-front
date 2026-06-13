import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { PublicBookingComponent } from './public-booking.component';
import { BookingSuccessComponent } from './booking-success/booking-success.component';

const routes: Routes = [
  { path: '', component: PublicBookingComponent },
  { path: 'confirmacion/:code', component: BookingSuccessComponent },
];

@NgModule({
  declarations: [PublicBookingComponent, BookingSuccessComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class PublicBookingModule {}
