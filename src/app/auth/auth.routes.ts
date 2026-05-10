import { Routes } from '@angular/router';
import {AccessComponent} from './access/access.component';
import {RegisterComponent} from './register/register.component';
import {VerifyEmailComponent} from './verify-email/verify-email.component';
import {ForgotPasswordComponent} from './forgot-password/forgot-password.component';
import {ResetPasswordComponent} from './reset-password/reset-password.component';
import {ProfileComponent} from '../user/profile/profile.component';
import {AuthGuard} from '../shared/guards/auth.guard';

export default [
    { path: 'access',
      loadComponent: () =>
        import('./access/access.component')
          .then(m => m.AccessComponent) },
    { path: 'verify-email', component: VerifyEmailComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
    { path: 'register', component: RegisterComponent },
] as Routes;
