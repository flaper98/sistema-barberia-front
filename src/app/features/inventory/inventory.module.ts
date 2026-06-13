import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { InventoryListComponent } from './inventory-list/inventory-list.component';
import { MovementFormComponent } from './movement-form/movement-form.component';

const routes: Routes = [
  { path: '',    component: InventoryListComponent },
  { path: 'new', component: MovementFormComponent },
];

@NgModule({
  declarations: [InventoryListComponent, MovementFormComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class InventoryModule {}
