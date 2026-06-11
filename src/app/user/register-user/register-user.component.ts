import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
}

@Component({
  selector: 'app-register-user',
  templateUrl: './register-user.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    CheckboxModule,
    ToastModule
  ],
  providers: [MessageService]
})
export class RegisterUserComponent {

  private authService = inject<AuthService>(AuthService);
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  submitted = false;
  user: RegisterForm = this.emptyForm();

  roles = [
    { label: 'Admin', value: 'Admin' },
    { label: 'User',  value: 'User'  }
  ];

  register() {
    this.submitted = true;

    if (!this.user.username || !this.user.email || !this.user.password || !this.user.role) {
      return;
    }

    this.authService.register(this.user).subscribe({
      next: () => {
        this.userService.users.reload();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `User ${this.user.username} registered successfully`
        });
        this.clear();
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message ?? 'Registration failed'
        });
      }
    });
  }

  clear() {
    this.user = this.emptyForm();
    this.submitted = false;
  }

  private emptyForm(): RegisterForm {
    return {
      username: '',
      email: '',
      password: '',
      role: '',
      isActive: true
    };
  }
}