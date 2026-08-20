import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { User } from '../../interfaces/user';
import { ROLE_OPTIONS } from '../../interfaces/roles';
import { DialogUserComponent } from './dialog-user/dialog-user.component';
import { DialogResetPasswordComponent } from './dialog-reset-password/dialog-reset-password.component';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['username', 'email', 'accessLevel', 'isActive', 'actions'];
  dataSource = new MatTableDataSource<User>([]);
  isLoading = true;
  search = '';
  onlyActive = false;
  roleOptions = ROLE_OPTIONS;

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private userService: UserService,
    private toast: ToastService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  loadUsers(): void {
    this.isLoading = true;
    const filters: { search?: string; isActive?: boolean } = {};
    if (this.search) {
      filters.search = this.search;
    }
    if (this.onlyActive) {
      filters.isActive = true;
    }
    this.userService.list(filters).subscribe({
      next: (users) => {
        this.dataSource.data = users;
        this.isLoading = false;
      },
      error: () => {
        this.toast.error('Error al cargar los usuarios');
        this.isLoading = false;
      },
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(DialogUserComponent, { data: null });
    dialogRef.afterClosed().subscribe((saved) => {
      if (saved) {
        this.loadUsers();
      }
    });
  }

  openEditDialog(user: User): void {
    const dialogRef = this.dialog.open(DialogUserComponent, { data: user });
    dialogRef.afterClosed().subscribe((saved) => {
      if (saved) {
        this.loadUsers();
      }
    });
  }

  openResetPasswordDialog(user: User): void {
    this.dialog.open(DialogResetPasswordComponent, { data: user });
  }

  toggleActive(user: User): void {
    const nextState = !user.isActive;
    this.userService.toggleActive(user.user_id, nextState).subscribe({
      next: (response) => {
        this.toast.success(response.message ?? 'Estado actualizado');
        this.loadUsers();
      },
      error: (err) => {
        this.toast.error(err.error?.error ?? 'No se pudo actualizar el estado');
        this.loadUsers();
      },
    });
  }

  changeRole(user: User, accessLevel: number): void {
    if (accessLevel === user.accessLevel) {
      return;
    }
    this.userService.changeRole(user.user_id, accessLevel).subscribe({
      next: (response) => {
        this.toast.success(response.message ?? 'Rol actualizado');
        this.loadUsers();
      },
      error: (err) => {
        this.toast.error(err.error?.error ?? 'No se pudo actualizar el rol');
        this.loadUsers();
      },
    });
  }
}
