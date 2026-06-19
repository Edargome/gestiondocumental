import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class TrashService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTrash(): Observable<{ files: any[]; folders: any[] }> {
    return this.http.get<{ files: any[]; folders: any[] }>(`${this.apiUrl}/trash`);
  }

  restoreFile(file_id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/trash/files/${file_id}/restore`, {});
  }

  restoreFolder(folder_id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/trash/folders/${folder_id}/restore`, {});
  }
}
