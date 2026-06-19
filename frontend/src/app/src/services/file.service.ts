import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { File, Historyfile } from '../interfaces/file';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  apiUrl = environment.apiUrl;
  private currentFile = new BehaviorSubject<File | null>(null);
  currentFile$: Observable<File | null> = this.currentFile.asObservable();
  private historyFile = new BehaviorSubject<Historyfile[]>([]);
  historyFile$: Observable<Historyfile[]> = this.historyFile.asObservable();
  constructor(private http: HttpClient) {}
  getFile(file_id: number) {
    this.http
      .get<any>(`${this.apiUrl}/files/${file_id}`)
      .subscribe((data: File) => {
        this.currentFile.next(data);
      });
    this.http
      .get<Historyfile[]>(`${this.apiUrl}/files/history/${file_id}`)
      .subscribe((data: Historyfile[]) => {
        console.log(data);
        this.historyFile.next(data);
      });
  }
  setNullFile() {
    this.currentFile.next(null);
    this.historyFile.next([]);
  }
  createFile(body: FormData) {
    return this.http.post<any>(`${this.apiUrl}/files/upload`, body, {
      observe: 'response',
    });
  }
  updateFile(body: FormData, file_id: number) {
    console.log(body);
    return this.http.put<any>(`${this.apiUrl}/files/upload/${file_id}`, body, {
      observe: 'response',
    });
  }
  downloadFile(file_id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/files/download/${file_id}`, {
      observe: 'response', // Observa toda la respuesta (cuerpo y encabezados)
      responseType: 'blob', // Manejar el cuerpo como Blob
    });
  }
  downloadFileVersion(
    file_id: number,
    version_number: number
  ): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.apiUrl}/files/downloadVersion/${file_id}/${version_number}`,
      {
        observe: 'response', // Observa toda la respuesta (cuerpo y encabezados)
        responseType: 'blob', // Manejar el cuerpo como Blob
      }
    );
  }

  deleteFile(file_id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/files/${file_id}`);
  }
}
