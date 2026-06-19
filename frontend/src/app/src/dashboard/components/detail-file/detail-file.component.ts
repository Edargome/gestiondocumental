import { Component } from '@angular/core';
import { FileService } from 'src/app/src/services/file.service';
import { File, Historyfile } from 'src/app/src/interfaces/file';
import { HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-detail-file',
  templateUrl: './detail-file.component.html',
  styleUrls: ['./detail-file.component.scss'],
})
export class DetailFileComponent {
  private readonly viewableExtensions = new Set([
    '.txt', '.csv', '.json', '.xml', '.log',
    '.pdf',
    '.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp', '.svg',
    '.mp3', '.ogg', '.wav',
    '.mp4', '.webm',
    '.html', '.htm',
  ]);

  file: File | null = null;
  history: Historyfile[] = [];
  displayedColumns: string[] = ['username', 'action', 'version_number', 'timestamp'];

  constructor(private fileService: FileService) {
    this.fileService.currentFile$.subscribe((currentFile) => {
      this.file = currentFile;
    });
    this.fileService.historyFile$.subscribe((historyFile) => {
      this.history = historyFile;
    });
  }

  isViewable(extname: string): boolean {
    return this.viewableExtensions.has(extname.toLowerCase());
  }

  openOrDownloadActiveFile(file_id: number): void {
    this.fileService.downloadFile(file_id).subscribe({
      next: (res: HttpResponse<Blob>) => this.handleBlob(res),
      error: (err) => console.error('Error al abrir el archivo', err),
    });
  }

  openOrDownloadVersion(file_id: number, version_number: number): void {
    this.fileService.downloadFileVersion(file_id, version_number).subscribe({
      next: (res: HttpResponse<Blob>) => this.handleBlob(res),
      error: (err) => console.error('Error al abrir la versión', err),
    });
  }

  private handleBlob(res: HttpResponse<Blob>): void {
    if (!res.body) return;

    const contentDisposition = res.headers.get('Content-Disposition');
    const matches = contentDisposition?.match(/filename="(.+)"/);
    const fileName = matches?.[1] || 'archivo';
    const ext = '.' + fileName.split('.').pop()!.toLowerCase();
    const url = window.URL.createObjectURL(res.body);

    if (this.viewableExtensions.has(ext)) {
      window.open(url, '_blank');
      // Revocar después de que el navegador haya tenido tiempo de abrir la pestaña
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  }
}
