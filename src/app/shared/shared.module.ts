import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatButtonModule }        from '@angular/material/button';
import { MatCardModule }          from '@angular/material/card';
import { MatFormFieldModule }     from '@angular/material/form-field';
import { MatInputModule }         from '@angular/material/input';
import { MatSelectModule }        from '@angular/material/select';
import { MatTableModule }         from '@angular/material/table';
import { MatPaginatorModule }     from '@angular/material/paginator';
import { MatSortModule }          from '@angular/material/sort';
import { MatIconModule }          from '@angular/material/icon';
import { MatToolbarModule }       from '@angular/material/toolbar';
import { MatSidenavModule }       from '@angular/material/sidenav';
import { MatListModule }          from '@angular/material/list';
import { MatMenuModule }          from '@angular/material/menu';
import { MatDialogModule }        from '@angular/material/dialog';
import { MatSnackBarModule }      from '@angular/material/snack-bar';
import { MatChipsModule }         from '@angular/material/chips';
import { MatBadgeModule }         from '@angular/material/badge';
import { MatTooltipModule }       from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule }    from '@angular/material/datepicker';
import { MatNativeDateModule }    from '@angular/material/core';
import { MatCheckboxModule }      from '@angular/material/checkbox';
import { MatRadioModule }         from '@angular/material/radio';
import { MatAutocompleteModule }  from '@angular/material/autocomplete';
import { MatTabsModule }          from '@angular/material/tabs';
import { MatDividerModule }       from '@angular/material/divider';
import { MatGridListModule }      from '@angular/material/grid-list';
import { MatExpansionModule }     from '@angular/material/expansion';
import { MatProgressBarModule }   from '@angular/material/progress-bar';
import { MatSlideToggleModule }   from '@angular/material/slide-toggle';
import { MatStepperModule }       from '@angular/material/stepper';

import { CountByStatusPipe } from './pipes/count-by-status.pipe';
import { SumByFieldPipe } from './pipes/sum-by-field.pipe';

const PIPES = [CountByStatusPipe, SumByFieldPipe];

const MAT_MODULES = [
  MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
  MatTableModule, MatPaginatorModule, MatSortModule, MatIconModule, MatToolbarModule,
  MatSidenavModule, MatListModule, MatMenuModule, MatDialogModule, MatSnackBarModule,
  MatChipsModule, MatBadgeModule, MatTooltipModule, MatProgressSpinnerModule,
  MatDatepickerModule, MatNativeDateModule, MatCheckboxModule, MatRadioModule,
  MatAutocompleteModule, MatTabsModule, MatDividerModule, MatGridListModule,
  MatExpansionModule, MatProgressBarModule, MatSlideToggleModule, MatStepperModule,
];

@NgModule({
  declarations: [...PIPES],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, ...MAT_MODULES],
  exports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, ...MAT_MODULES, ...PIPES],
})
export class SharedModule {}
