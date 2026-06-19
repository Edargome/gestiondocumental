import { Component, Inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FlatTreeControl } from '@angular/cdk/tree';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { FolderService } from 'src/app/src/services/folder.service';
import { NodeTree } from 'src/app/src/interfaces/node-tree';
import { environment } from 'src/environments/environment';

export interface MoveDialogData {
  id: number;
  type: 'task' | 'folder';
  name: string;
}

interface FlatNode {
  expandable: boolean;
  name: string;
  level: number;
  folder_id: number;
}

@Component({
  selector: 'app-dialog-move',
  templateUrl: './dialog-move.component.html',
  styleUrls: ['./dialog-move.component.scss'],
})
export class DialogMoveComponent implements OnInit {
  apiUrl = environment.apiUrl;
  selectedFolderId: number | null = null;

  private _transformer = (node: NodeTree, level: number): FlatNode => ({
    expandable: !!node.children && node.children.length > 0,
    name: node.name,
    folder_id: node.id,
    level,
  });

  treeControl = new FlatTreeControl<FlatNode>(
    (node) => node.level,
    (node) => node.expandable
  );

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    (node) => node.level,
    (node) => node.expandable,
    (node) => node.children
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  constructor(
    private folderService: FolderService,
    public dialogRef: MatDialogRef<DialogMoveComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MoveDialogData,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.folderService.contentTree$.subscribe((nodes: NodeTree[]) => {
      this.dataSource.data = nodes;
    });
  }

  hasChild = (_: number, node: FlatNode): boolean => node.expandable;

  selectFolder(folder_id: number): void {
    this.selectedFolderId = folder_id;
  }

  confirm(): void {
    if (this.selectedFolderId === null) return;

    const body = { target_folder_id: this.selectedFolderId };
    const url =
      this.data.type === 'task'
        ? `${this.apiUrl}/files/${this.data.id}/move`
        : `${this.apiUrl}/folders/${this.data.id}/move`;

    this.http.patch<any>(url, body).subscribe({
      next: () => this.dialogRef.close({ success: true }),
      error: (error) => this.dialogRef.close({ success: false, error }),
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
