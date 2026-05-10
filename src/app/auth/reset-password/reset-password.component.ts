import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from 'primeng/api';
import {PasswordModule} from 'primeng/password';
import {DropdownModule} from 'primeng/dropdown';
import {ToastModule} from 'primeng/toast';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
  providers: [MessageService],
  imports: [FormsModule, ReactiveFormsModule, PasswordModule, DropdownModule, ToastModule]
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  token: string | null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.token = null;
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No token provided.' });
      this.router.navigate(['/login']);
    }
  }

  onSubmit(): void {
    if (this.resetForm.valid && this.token) {
      this.authService.resetPassword(this.token, this.resetForm.value.password).subscribe(
        () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Password reset successfully.' });
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        (error) => this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error.message })
      );
    }
  }
}
