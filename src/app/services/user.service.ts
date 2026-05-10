import {computed, inject, Injectable, resource, signal} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {lastValueFrom, throwError} from 'rxjs';


export interface User {
  id: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: number;
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
    this.http.post(`${this.apiUrl}/delete-user`, {
      user_id: userId
    }).subscribe({
      next: (data) => {
        this.users.reload()
      },
      error: (err) => {
        console.error('Error deleting user:', err);
        return throwError(() => err);
      }
    });
  }

}
