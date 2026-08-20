import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CreateUserPayload, UpdateUserPayload, User } from '../interfaces/user';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}
  auth(nickname: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/users/login`, {
      nickname,
      password,
    });
  }
  isAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }
    return true;
  }
  me() {
    return this.http.get<User>(`${this.apiUrl}/users/me`);
  }

  list(filters: { search?: string; isActive?: boolean; accessLevel?: number } = {}) {
    let params = new HttpParams();
    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.isActive !== undefined) {
      params = params.set('isActive', String(filters.isActive));
    }
    if (filters.accessLevel !== undefined) {
      params = params.set('accessLevel', String(filters.accessLevel));
    }
    return this.http.get<User[]>(`${this.apiUrl}/users`, { params });
  }

  create(payload: CreateUserPayload) {
    return this.http.post<any>(`${this.apiUrl}/users`, payload);
  }

  update(user_id: number, payload: UpdateUserPayload) {
    return this.http.patch<any>(`${this.apiUrl}/users/${user_id}`, payload);
  }

  toggleActive(user_id: number, isActive: boolean) {
    return this.http.patch<any>(`${this.apiUrl}/users/${user_id}/status`, { isActive });
  }

  changeRole(user_id: number, accessLevel: number) {
    return this.http.patch<any>(`${this.apiUrl}/users/${user_id}/role`, { accessLevel });
  }

  resetPassword(user_id: number, password: string) {
    return this.http.patch<any>(`${this.apiUrl}/users/${user_id}/password`, { password });
  }

  changeOwnPassword(currentPassword: string, newPassword: string) {
    return this.http.patch<any>(`${this.apiUrl}/users/me/password`, {
      currentPassword,
      newPassword,
    });
  }
}
