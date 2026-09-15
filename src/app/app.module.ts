import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 
import {withInterceptors} from '@angular/common/http';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'; 
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
import { DatePipe, registerLocaleData } from '@angular/common'; 
import es from '@angular/common/locales/es'; 
registerLocaleData(es); 
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
        BrowserAnimationsModule, 
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
        DialogModule, 
        ProgressSpinnerModule, 
        FormsModule,
        ReactiveFormsModule,
        PasswordModule,
        DropdownModule
    ],
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideAnimationsAsync(),
        providePrimeNG({
            theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } },
            translation: {
                firstDayOfWeek: 1
            }
        }),
        MessageService,
        DatePipe,
        BrowserModule,
        ReactiveFormsModule,
    ],
    bootstrap: [AppComponent],
})
export class AppModule { }
