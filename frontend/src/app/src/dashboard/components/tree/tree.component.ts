import { Component, OnInit } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { FolderService } from 'src/app/src/services/folder.service';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { NodeTree } from 'src/app/src/interfaces/node-tree';
import { CurrentFolderService } from 'src/app/src/services/current-folder.service';
import { FileService } from 'src/app/src/services/file.service';

/** Flat node with expandable and level information */
interface FlatNode {
  expandable: boolean;
  name: string;
  level: number;
  folder_id: number; // Agregar la propiedad folder_id
}

@Component({
  selector: 'app-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.scss'],
})
export class TreeComponent implements OnInit {
  collapsed = false;

  toggle() {
    this.collapsed = !this.collapsed;
  }
  // Actualizar el transformer para que se ajuste a la interfaz FlatNode
  private _transformer = (node: NodeTree, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      name: node.name,
      folder_id: node.id,
      level: level,
    };
  };
  currentFolder: number = 1;
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
    private folderServices: FolderService,
    private currentFolderSevice: CurrentFolderService,
    private fileService: FileService
  ) {}

  ngOnInit(): void {
    this.folderServices.contentTree$.subscribe((result: NodeTree[]) => {
      this.dataSource.data = result;
    });
    this.currentFolderSevice.currentFolder$.subscribe((value) => {
      if (value != null) {
        this.currentFolder = value;
        const newNode = this.getNodeByFolderId(value);
        if (newNode) {
          this.expandToNode(newNode);
        }
      }
    });
  }

  hasChild = (_: number, node: FlatNode) => node.expandable;

  returnFolderId(value: number) {
    this.currentFolder = value;
    this.currentFolderSevice.setCurrentFolder(value);
    this.fileService.setNullFile();
  }
  private expandToNode(node: FlatNode) {
    const parent = this.getParentNode(node);
    if (parent) {
      this.treeControl.expand(parent);
      this.expandToNode(parent);
    }
  }

  private getParentNode(node: FlatNode): FlatNode | null {
    const nodeIndex = this.treeControl.dataNodes.indexOf(node);
    if (nodeIndex > 0) {
      for (let i = nodeIndex - 1; i >= 0; i--) {
        const potentialParent = this.treeControl.dataNodes[i];
        if (potentialParent.level === node.level - 1) {
          return potentialParent;
        }
      }
    }
    return null;
  }
  private getNodeByFolderId(folderId: number): FlatNode | undefined {
    return this.treeControl.dataNodes.find(
      (node) => node.folder_id === folderId
    );
  }
}
