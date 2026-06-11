import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

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
  private apiUrl = `${environment.apiUrl}/api/user`;

  http = inject(HttpClient);

  users = resource<User[], never>({
    loader: () => {
      return lastValueFrom(
        this.http.get<User[]>(`${this.apiUrl}/users`)
      );
    }
  });

  inactiveUsers = resource<User[], never>({
    loader: () => lastValueFrom(
      this.http.get<User[]>(`${this.apiUrl}/users/inactive`)
    )
  });

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`);
  }

  deleteUser(userId: number) {
    this.http.delete(`${this.apiUrl}/delete/${userId}`).subscribe({
      next: () => {
        this.users.reload();
        this.inactiveUsers.reload();
      },
      error: (err) => {
        console.error('Error deleting user:', err);
      }
    });
  }

  updateUser(userId: number, request: { username?: string; email?: string; role?: string; password?: string; isActive?: boolean }) {
    this.http.put(`${this.apiUrl}/update/${userId}`, request).subscribe({
      next: () => {
        this.users.reload();
        this.inactiveUsers.reload();
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
