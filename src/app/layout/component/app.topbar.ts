import { Component, inject, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { AuthService } from '../../services/auth.service';
import { AnnouncementService } from '../../services/announcement.service';

@Component({
    selector: 'app-topbar',
    standalone: true,

    imports: [
        RouterModule,
        CommonModule,
        StyleClassModule,
        AppConfigurator
    ],

    styles: [`
        .message-action {
            position: relative;
        }

        .message-action .message-badge {
            position: absolute;
            top: 0.35rem;
            right: 0.35rem;

            width: 1.1rem;
            height: 1.1rem;

            border-radius: 9999px;

            background: #ef4444;
            color: #ffffff;

            font-size: 0.65rem;
            font-weight: 700;

            display: flex;
            align-items: center;
            justify-content: center;

            z-index: 1000;

            line-height: 1;

            border: 2px solid var(--surface-card);
        }

        .layout-topbar-action {
            overflow: visible !important;
        }
    `],

    template: `
        <div class="layout-topbar">

            <div class="layout-topbar-logo-container">

                <button
                    class="layout-menu-button layout-topbar-action"
                    (click)="layoutService.onMenuToggle()"
                >
                    <i class="pi pi-bars"></i>
                </button>

                <a class="layout-topbar-logo" routerLink="/">
                    <span class="logo-text-full">Gmitrzak English Academy</span>
                    <span class="logo-text-short">Gmitrzak</span>
                </a>

            </div>

            <div class="layout-topbar-actions">

                <div class="layout-config-menu">

                    <button
                        type="button"
                        class="layout-topbar-action"
                        (click)="toggleDarkMode()"
                    >
                        <i
                            [ngClass]="{
                                'pi': true,
                                'pi-moon': layoutService.isDarkTheme(),
                                'pi-sun': !layoutService.isDarkTheme()
                            }"
                        ></i>
                    </button>

                    <div class="relative">

                        <button
                            class="layout-topbar-action layout-topbar-action-highlight"
                            pStyleClass="@next"
                            enterFromClass="hidden"
                            enterActiveClass="animate-scalein"
                            leaveToClass="hidden"
                            leaveActiveClass="animate-fadeout"
                            [hideOnOutsideClick]="true"
                        >
                            <i class="pi pi-palette"></i>
                        </button>

                        <app-configurator />

                    </div>

                </div>

                <button
                    class="layout-topbar-menu-button layout-topbar-action"
                    pStyleClass="@next"
                    enterFromClass="hidden"
                    enterActiveClass="animate-scalein"
                    leaveToClass="hidden"
                    leaveActiveClass="animate-fadeout"
                    [hideOnOutsideClick]="true"
                >
                    <i class="pi pi-ellipsis-v"></i>
                </button>

                <div class="layout-topbar-menu hidden lg:block">

                    <div class="layout-topbar-menu-content">

                        <button
                            type="button"
                            class="layout-topbar-action message-action"
                            (click)="goToMessages()"
                        >

                            <i class="pi pi-inbox"></i>

                            <span
                                *ngIf="announcementService.unreadCount() > 0"
                                class="message-badge"
                            >
                                {{
                                    announcementService.unreadCount() > 9
                                        ? '9+'
                                        : announcementService.unreadCount()
                                }}
                            </span>

                            <span>Messages</span>

                        </button>

                        <button
                            type="button"
                            class="layout-topbar-action"
                            (click)="goToProfile()"
                        >
                            <i class="pi pi-user"></i>
                            <span>Profile</span>
                        </button>

                    </div>

                </div>

            </div>

        </div>
    `
})
export class AppTopbar implements OnInit {

    items!: MenuItem[];

    private authService = inject(AuthService);
    private router = inject(Router);

    public layoutService = inject(LayoutService);
    public announcementService = inject(AnnouncementService);

    ngOnInit(): void {
        this.announcementService.refreshUnreadCount();
    }

    toggleDarkMode(): void {
        this.layoutService.layoutConfig.update((state) => ({
            ...state,
            darkTheme: !state.darkTheme
        }));
    }

    goToProfile(): void {
        const userId = this.authService.getUserId();

        if (userId) {
            this.router.navigate(['/profiles', userId], {
                replaceUrl: true
            });
        } else {
            this.router.navigate(['/login']);
        }
    }

    goToMessages(): void {
        this.router.navigate(['/messages']);
    }
}