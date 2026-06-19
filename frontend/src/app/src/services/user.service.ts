import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../interfaces/user';
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
  getUserActive() {
    return this.http.get<User[]>(`${this.apiUrl}/users/listuser`);
  }
}
