import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from 'primeng/api';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {PasswordModule} from 'primeng/password';
import {DropdownModule} from 'primeng/dropdown';
import {ToastModule} from 'primeng/toast';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css'],
  providers: [MessageService],
  imports: [ToastModule]
})
export class VerifyEmailComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.authService.verifyEmail(token).subscribe(
        () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Email verified successfully.' });
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        (error) => this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error.message })
      );
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No token provided.' });
    }
  }
}
