import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  readonly isDark$: Observable<boolean>;
  readonly accessLevel: string | null = localStorage.getItem('level');
  showTrash = false;

  @Output() trashToggled = new EventEmitter<boolean>();

  constructor(private router: Router, private themeService: ThemeService) {
    this.isDark$ = this.themeService.isDark$;
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  toggleTrash(): void {
    this.showTrash = !this.showTrash;
    this.trashToggled.emit(this.showTrash);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('level');
    this.router.navigate(['/admin/login']);
  }
}
