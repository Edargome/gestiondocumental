import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { TrashService } from 'src/app/src/services/trash.service';
import { DialogRestoreComponent } from '../dialog-restore/dialog-restore.component';

@Component({
  selector: 'app-trash',
  templateUrl: './trash.component.html',
  styleUrls: ['./trash.component.scss'],
})
export class TrashComponent implements OnInit {
  displayedColumns: string[] = ['type', 'name', 'parent_folder', 'deleted_at', 'deleted_by', 'action'];
  dataSource = new MatTableDataSource<any>([]);
  isLoading = true;

  @Output() exitTrash = new EventEmitter<void>();

  constructor(private trashService: TrashService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadTrash();
  }

  loadTrash(): void {
    this.isLoading = true;
    this.trashService.getTrash().subscribe({
      next: ({ files, folders }) => {
        const rows = [
          ...folders.map((f) => ({ ...f, id: f.folder_id, type: 'folder', parent_name: f.parent_folder_name, parent_isDelete: f.parent_folder_isDelete })),
          ...files.map((f) => ({ ...f, id: f.file_id, type: 'file', parent_name: f.folder_name, parent_isDelete: f.folder_isDelete })),
        ];
        this.dataSource.data = rows;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  openRestoreDialog(row: any): void {
    const dialogRef = this.dialog.open(DialogRestoreComponent, {
      data: { id: row.id, name: row.name, type: row.type },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.restored) {
        this.loadTrash();
      }
    });
  }
}
