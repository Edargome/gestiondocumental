import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
} from 'rxjs/operators';
import { CurrentFolderService } from 'src/app/src/services/current-folder.service';
import { FolderService } from 'src/app/src/services/folder.service';
import { SearchResult } from 'src/app/src/interfaces/search-result';

@Component({
  selector: 'app-dialog-search',
  templateUrl: './dialog-search.component.html',
  styleUrls: ['./dialog-search.component.scss'],
})
export class DialogSearchComponent {
  term = '';
  results: SearchResult[] = [];
  isLoading = false;
  searched = false;
  displayedColumns: string[] = ['type', 'name', 'path', 'updated_at'];
  private termChanges = new Subject<string>();

  constructor(
    private folderService: FolderService,
    private currentFolderService: CurrentFolderService,
    public dialogRef: MatDialogRef<DialogSearchComponent>
  ) {
    this.termChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (term.trim().length < 2) {
            this.isLoading = false;
            this.searched = false;
            return [];
          }
          this.isLoading = true;
          this.searched = true;
          return this.folderService.search(term.trim());
        })
      )
      .subscribe((results) => {
        this.results = results;
        this.isLoading = false;
      });
  }

  onTermChange(term: string): void {
    if (term.trim().length < 2) {
      this.results = [];
    }
    this.termChanges.next(term);
  }

  selectResult(row: SearchResult): void {
    this.currentFolderService.setCurrentFolder(row.target_folder_id);
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
