import {computed, inject, Injectable, resource, signal} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {lastValueFrom, throwError} from 'rxjs';


export interface User {
  id: number;
  username?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  password?: string;
}

export interface Users {
  users: User[];
}



@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = '/api/user'; // Adjust to your backend URL

  http = inject(HttpClient);

  users = resource<User[], string>({
    loader: (request) => {
      const request$ = this.http.get(`${this.apiUrl}/users`);
      return lastValueFrom<any>(request$);
    }});

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`);
  }

  deleteUser(userId: number) {
    this.http.delete(`${this.apiUrl}/delete/${userId}`).subscribe({
      next: (data) => {
        this.users.reload();
      },
      error: (err) => {
        console.error('Error deleting user:', err);
      }
    });
  }

  updateUser(userId: number, request: { username?: string; email?: string; role?: string; password?: string }) {
    this.http.put(`${this.apiUrl}/update/${userId}`, request).subscribe({
      next: () => {
        this.users.reload();
      },
      error: (err) => {
        console.error('Error updating user:', err);
      }
    });
  }

  deleteManyUsers(ids: number[]) {
    return this.http.delete(`${this.apiUrl}/delete`, { params: { userIds: ids } });
  }

}
