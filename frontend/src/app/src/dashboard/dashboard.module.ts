import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { HeaderComponent } from './components/header/header.component';
import { TreeComponent } from './components/tree/tree.component';
import { LayoutComponent } from './layout/layout.component';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DetailFileComponent } from './components/detail-file/detail-file.component';
import { WorkplaceComponent } from './components/workplace/workplace.component';
import { DialogFolderComponent } from './components/dialog-folder/dialog-folder.component';
import { DialogFileComponent } from './components/dialog-file/dialog-file.component';
import { DialogUpdateFileComponent } from './components/dialog-update-file/dialog-update-file.component';
import { DialogPermissionsComponent } from './components/dialog-permissions/dialog-permissions.component';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeModule } from '@angular/material/tree';
import { DialogDeleteFileComponent } from './components/dialog-delete-file/dialog-delete-file.component';
import { DialogEditFolderComponent } from './components/dialog-edit-folder/dialog-edit-folder.component';
import { DialogMoveComponent } from './components/dialog-move/dialog-move.component';
import { TrashComponent } from './components/trash/trash.component';
import { DialogRestoreComponent } from './components/dialog-restore/dialog-restore.component';

@NgModule({
  declarations: [
    HeaderComponent,
    TreeComponent,
    LayoutComponent,
    DetailFileComponent,
    WorkplaceComponent,
    DialogFolderComponent,
    DialogFileComponent,
    DialogUpdateFileComponent,
    DialogPermissionsComponent,
    DialogDeleteFileComponent,
    DialogEditFolderComponent,
    DialogMoveComponent,
    TrashComponent,
    DialogRestoreComponent,
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    MatTreeModule,
  ],
})
export class DashboardModule {}
