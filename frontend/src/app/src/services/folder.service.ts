import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  FolderPath,
  FolderTree,
  NodeTree,
  Path,
} from '../interfaces/node-tree';
import { ContentFolder } from '../interfaces/content-folder';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FolderService {
  apiUrl = environment.apiUrl;
  private contentFolder = new BehaviorSubject<ContentFolder | null>(null);
  private contentTree = new BehaviorSubject<NodeTree[]>([]);
  private folderPath = new BehaviorSubject<FolderPath[]>([]);
  contentFolder$: Observable<ContentFolder | null> =
    this.contentFolder.asObservable();
  contentTree$: Observable<NodeTree[]> = this.contentTree.asObservable();
  folderPath$: Observable<FolderPath[]> = this.folderPath.asObservable();

  constructor(private http: HttpClient) {
    this.getContentFolder(1);
    this.getRootTree();
  }

  getRootTree(): void {
    this.http
      .get<FolderTree>(`${this.apiUrl}/folders/0/tree`)
      .pipe(map((result: FolderTree) => result.folderTree))
      .subscribe((data: NodeTree[]) => {
        this.contentTree.next(data);
      });
  }

  getContentFolder(folder_id: number): void {
    this.http
      .get<ContentFolder>(`${this.apiUrl}/folders/${folder_id}/contents`)
      .subscribe((data: ContentFolder) => {
        this.contentFolder.next(data);
      });
  }

  getFolderPath(folder_id: number): void {
    this.http
      .get<Path>(`${this.apiUrl}/folders/${folder_id}/path`)
      .subscribe((data: Path) => {
        this.folderPath.next(data.folderPath);
      });
  }

  createFolder(parent_folder_id: number, name: string, desc?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/folders/create`, {
      name,
      desc,
      parent_folder_id,
    });
  }

  deleteFolder(folder_id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/folders/${folder_id}`);
  }

  updateFolder(folder_id: number, name: string, desc: string) {
    return this.http.post<any>(`${this.apiUrl}/folders/${folder_id}/update`, {
      name,
      desc,
    });
  }

  moveFolder(folder_id: number, target_folder_id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/folders/${folder_id}/move`, {
      target_folder_id,
    });
  }

  moveFile(file_id: number, target_folder_id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/files/${file_id}/move`, {
      target_folder_id,
    });
  }
}
