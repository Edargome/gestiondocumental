import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CurrentFolderService {
  private currentFolder = new BehaviorSubject<number>(1);
  currentFolder$: Observable<number> = this.currentFolder.asObservable();
  setCurrentFolder(id: number) {
    if (this.currentFolder.value != id) {
      this.currentFolder.next(id);
    }
  }
}
