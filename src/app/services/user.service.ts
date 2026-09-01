import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface User {
  id: number;
  username?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  streak?: number;
  streakOverride?: number | null;
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
  authService = inject(AuthService);

  users = resource<User[], never>({
    loader: () => {
      if (this.authService.getRole() !== 'Admin') {
        return Promise.resolve([]);
      }
      return lastValueFrom(
        this.http.get<User[]>(`${this.apiUrl}/users`)
      );
    }
  });

  inactiveUsers = resource<User[], never>({
    loader: () => {
      if (this.authService.getRole() !== 'Admin') {
        return Promise.resolve([]);
      }
      return lastValueFrom(
        this.http.get<User[]>(`${this.apiUrl}/users/inactive`)
      );
    }
  });

  getProfile(): Observable<any> {
    const userId = this.authService.getUserId();
    return this.http.get(`${environment.apiUrl}/api/profile/${userId}`);
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

  updateUser(userId: number, request: { username?: string; email?: string; role?: string; password?: string; isActive?: boolean; streakOverride?: number | null }) {
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

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  deleteManyUsers(ids: number[]) {
    return this.http.delete(`${this.apiUrl}/delete`, { params: { userIds: ids } });
  }

}
