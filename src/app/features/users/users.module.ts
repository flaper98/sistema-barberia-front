import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { UserListComponent } from './user-list/user-list.component';
import { UserFormComponent } from './user-form/user-form.component';
import { RolePermissionsComponent } from './role-permissions/role-permissions.component';

const routes: Routes = [
  { path: '',            component: UserListComponent },
  { path: 'permissions', component: RolePermissionsComponent },
  { path: 'new',         component: UserFormComponent },
  { path: ':id',         component: UserFormComponent },
];

@NgModule({
  declarations: [UserListComponent, UserFormComponent, RolePermissionsComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class UsersModule {}
