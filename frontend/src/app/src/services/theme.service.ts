import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

const THEME_KEY = 'theme';
const DARK_CLASS = 'dark-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _isDark$ = new BehaviorSubject<boolean>(false);

  readonly isDark$: Observable<boolean> = this._isDark$.asObservable();

  constructor() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark =
      saved !== null
        ? saved === 'dark'
        : window.matchMedia('(prefers-color-scheme: dark)').matches;

    this._applyTheme(prefersDark);
  }

  toggle(): void {
    this._applyTheme(!this._isDark$.value);
  }

  private _applyTheme(dark: boolean): void {
    this._isDark$.next(dark);
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');

    if (dark) {
      document.body.classList.add(DARK_CLASS);
    } else {
      document.body.classList.remove(DARK_CLASS);
    }
  }
}
