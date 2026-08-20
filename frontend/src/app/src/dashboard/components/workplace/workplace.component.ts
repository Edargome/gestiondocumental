import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  FolterContent,
  FileContent,
} from 'src/app/src/interfaces/content-folder';
import { CurrentFolderService } from 'src/app/src/services/current-folder.service';
import { FolderService } from 'src/app/src/services/folder.service';
import { DialogFolderComponent } from '../dialog-folder/dialog-folder.component';
import { DialogFileComponent } from '../dialog-file/dialog-file.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { FileService } from 'src/app/src/services/file.service';
import { HttpResponse } from '@angular/common/http';
import {
  DataUpdate,
  DialogUpdateFileComponent,
} from '../dialog-update-file/dialog-update-file.component';
import { DialogPermissionsComponent } from '../dialog-permissions/dialog-permissions.component';
import { DialogSearchComponent } from '../dialog-search/dialog-search.component';
import { DialogDeleteFileComponent } from '../dialog-delete-file/dialog-delete-file.component';
import { FolderPath } from 'src/app/src/interfaces/node-tree';
import { DialogEditFolderComponent } from '../dialog-edit-folder/dialog-edit-folder.component';
import {
  DialogMoveComponent,
  MoveDialogData,
} from '../dialog-move/dialog-move.component';
import { ToastService } from 'src/app/src/services/toast.service';

@Component({
  selector: 'app-workplace',
  templateUrl: './workplace.component.html',
  styleUrls: ['./workplace.component.scss'],
})
export class WorkplaceComponent implements OnInit, AfterViewInit {
  private viewableExtensions = [
    // Archivos de texto
    '.txt',
    '.csv',
    '.json',
    '.xml',
    '.log',

    // Documentos
    '.pdf',

    // Imágenes
    '.jpeg',
    '.jpg',
    '.png',
    '.gif',
    '.bmp',
    '.webp',
    '.svg',

    // Audio
    // '.mp3',
    // '.ogg',
    // '.wav',

    // Video
    // '.mp4',
    // '.webm',
    // '.ogg',

    // Archivos HTML
    '.html',
    '.htm',
  ];
  displayedColumns: string[] = ['name', 'created_at', 'updated_at', 'action'];
  dataSource!: MatTableDataSource<any>;
  folderPath: FolderPath[] = [];
  isLoading: boolean = false;
  accessLevel: string | null = localStorage.getItem('level');
  @ViewChild(MatSort) sort!: MatSort;
  private datafolder: FolterContent[] = [];
  private datafile: FileContent[] = [];
  private parent_folder_id!: number;
  constructor(
    private _liveAnnouncer: LiveAnnouncer,
    private folderService: FolderService,
    private currentFolderService: CurrentFolderService,
    private fileService: FileService,
    private toast: ToastService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.currentFolderService.currentFolder$.subscribe((folder_id) => {
      this.parent_folder_id = folder_id;
      this.folderService.getContentFolder(folder_id);
      this.folderService.getFolderPath(folder_id);
    });
    this.folderService.contentFolder$.subscribe((contentFolder) => {
      this.datafolder = contentFolder?.folders || [];
      this.datafile = contentFolder?.files || [];
      this.dataSource = new MatTableDataSource(
        [this.datafolder, this.datafile].flat()
      );
      this.dataSource.sort = this.sort;
    });
    this.folderService.folderPath$.subscribe((folderPath) => {
      this.folderPath = folderPath;
    });
  }
  ngAfterViewInit() {
    this.sort.active = 'create_at';
    this.sort.direction = 'asc';
    this.dataSource.sort = this.sort;
  }
  actionClic(id: number, type: string) {
    this.isLoading = true;
    if (type == 'folder') {
      this.setCurrentFolder(id);
    } else {
      this.setCurrentFile(id);
    }
  }
  /** Announce the change in sort state for assistive technology. */
  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }
  openDialogFolder(): void {
    const dialogRef = this.dialog.open(DialogFolderComponent, {
      data: this.parent_folder_id,
    });
  }
  openSearchDialog(): void {
    this.dialog.open(DialogSearchComponent, { width: '600px' });
  }
  openDialogUpdateFile(file_id: number): void {
    const data: DataUpdate = {
      file_id,
      folder_id: this.parent_folder_id,
    };
    const dialogRef = this.dialog.open(DialogUpdateFileComponent, {
      data: data,
    });
  }
  openDialogFile(): void {
    const dialogRef = this.dialog.open(DialogFileComponent, {
      data: this.parent_folder_id,
    });
  }
  openDialogEditFolder(folder: any): void {
    const dialogRef = this.dialog.open(DialogEditFolderComponent, {
      data: folder,
    });
  }

  downFile(file_id: number) {
    this.fileService.downloadFile(file_id).subscribe({
      next: (res: HttpResponse<Blob>) => {
        // Validar que el cuerpo no sea null
        if (!res.body) {
          console.error('El cuerpo de la respuesta es null');
          return;
        }

        // Obtener el nombre del archivo del encabezado Content-Disposition
        const contentDisposition = res.headers.get('Content-Disposition');
        const matches = contentDisposition?.match(/filename="(.+)"/);
        const fileName = matches?.[1] || 'archivo-descargado';

        // Crear URL del Blob
        const url = window.URL.createObjectURL(res.body);

        // Abrir en nueva pestaña (para PDFs, imágenes, etc.)
        if (this.validatedExtension(fileName)) {
          window.open(url, '_blank');
        } else {
          // Forzar descarga para otros tipos de archivo
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }

        // Revocar la URL temporal
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error al descargar el archivo', err);
      },
    });
  }
  setPermissions(file_id: number) {
    const dialogRef = this.dialog.open(DialogPermissionsComponent, {
      data: file_id,
    });
  }

  deleteFile(row: any) {
    row.folder_id = this.parent_folder_id;
    const dialogRef = this.dialog.open(DialogDeleteFileComponent, {
      data: row,
    });
  }

  openMoveDialog(row: any): void {
    const dialogRef = this.dialog.open(DialogMoveComponent, {
      data: { id: row.id, type: row.type, name: row.name } as MoveDialogData,
      width: '400px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.toast.success('Elemento movido con éxito');
        this.folderService.getContentFolder(this.parent_folder_id);
        this.folderService.getRootTree();
      } else if (result?.error) {
        this.toast.error(
          result.error?.error?.error ?? 'Error al mover el elemento'
        );
      }
    });
  }

  deleteFolder(folder_id: number): void {
    this.folderService.deleteFolder(folder_id).subscribe((response) => {
      if (response.message) {
        this.toast.success(response.message);
        this.folderService.getContentFolder(this.parent_folder_id);
        this.folderService.getRootTree();
      } else {
        this.toast.error(response.error);
      }
    });
  }

  private setCurrentFolder(folder_id: number): void {
    this.folderService.getContentFolder(folder_id);
    this.folderService.getFolderPath(folder_id);
    this.currentFolderService.setCurrentFolder(folder_id);
    this.fileService.setNullFile();
    this.isLoading = false;
  }
  private setCurrentFile(file_id: number): void {
    this.fileService.getFile(file_id);
    this.isLoading = false;
  }
  private validatedExtension(fileName: string): boolean {
    const name = fileName.split('.');
    const extname = name[name.length - 1];
    return this.viewableExtensions.some(
      (extension) => extension == `.${extname}`
    );
  }
}
