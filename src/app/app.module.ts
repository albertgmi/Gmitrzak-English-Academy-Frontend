import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; // Needed by PrimeNG for browser animations
import {withInterceptors} from '@angular/common/http';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'; // In angular 18 it is recommended to manage the http provider this way

// PrimeNG modules (and some of angular/common) that are needed by the reusable table component
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule } from 'primeng/paginator';
import { TagModule } from 'primeng/tag';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { SplitButtonModule } from 'primeng/splitbutton';
import { CheckboxModule } from 'primeng/checkbox';
import { MenuModule } from 'primeng/menu';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CardModule } from 'primeng/card';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DatePipe, registerLocaleData } from '@angular/common'; // registerLocaleData import is optional. Needed for scenarios were you would like to manage different locales from "en-US", like "es-ES".

import es from '@angular/common/locales/es'; // Optional. Needed for scenarios were you would like to manage different locales from "en-US", like "es-ES".
registerLocaleData(es); // Optional. Needed for scenarios were you would like to manage different locales from "en-US", like "es-ES".

// Optional imports to show the loading indicator
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling} from "@angular/router";
import {appRoutes} from "./app.routes";
import {provideAnimationsAsync} from "@angular/platform-browser/animations/async";
import {providePrimeNG} from "primeng/config";
import Aura from "@primeng/themes/aura";
import {AppComponent} from "./app.component";
import {LoginComponent} from './auth/login/login.component';
import {RegisterComponent} from './auth/register/register.component';
import {VerifyEmailComponent} from './auth/verify-email/verify-email.component';
import {ForgotPasswordComponent} from './auth/forgot-password/forgot-password.component';
import {ResetPasswordComponent} from './auth/reset-password/reset-password.component';
import {ProfileComponent} from './user/profile/profile.component';
import {PasswordModule} from 'primeng/password';
import {DropdownModule} from 'primeng/dropdown';
import {authInterceptor} from './shared/interceptors/auth.interceptor';
import { errorInterceptor } from './shared/interceptors/error.interceptor';


@NgModule({
    declarations: [
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule, // Needed by PrimeNG for browser animations
        ToastModule,
        TableModule,
        InputTextModule,
        ButtonModule,
        MultiSelectModule,
        PaginatorModule,
        TagModule,
        RippleModule,
        TooltipModule,
        SkeletonModule,
        CheckboxModule,
        SplitButtonModule,
        MenuModule,
        SelectButtonModule,
        CardModule,
        RadioButtonModule,
        DialogModule, // Optional import to show the loading indicator in HTTP calls
        ProgressSpinnerModule, // Optional import to show the loading indicator in HTTP calls
        FormsModule,
        ReactiveFormsModule,
        PasswordModule,
        DropdownModule
    ],
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
        MessageService,
        DatePipe,

        BrowserModule,
        ReactiveFormsModule,
    ],
    bootstrap: [AppComponent],
})
export class AppModule { }
