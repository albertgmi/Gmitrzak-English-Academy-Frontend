import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthService } from '../../services/auth.service';
import { DashboardService, AdminDashboardDto, StudentDashboardDto}  from '../../services/dashboard.service';
import { AvatarComponent } from '../avatar/avatar.component';

type SeverityType = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, ChartModule, TagModule, ButtonModule, SkeletonModule, AvatarComponent],
    templateUrl: './dashboard.component.html'
})
export class Dashboard implements OnInit {
    private dashboardService = inject(DashboardService);
    private authService = inject(AuthService);

    role = this.authService.getRole();

    adminData = signal<AdminDashboardDto | null>(null);
    studentData = signal<StudentDashboardDto | null>(null);
    loading = signal(true);

    ngOnInit() {
        if (this.role === 'Admin') {
            this.dashboardService.getAdminDashboard().subscribe({
                next: (d) => { this.adminData.set(d); this.loading.set(false); },
                error: () => this.loading.set(false)
            });
        } else {
            this.dashboardService.getStudentDashboard().subscribe({
                next: (d) => { this.studentData.set(d); this.loading.set(false); },
                error: () => this.loading.set(false)
            });
        }
    }

    gradeSeverity(p: number): SeverityType {
        if (p >= 80) return 'success';
        if (p >= 60) return 'warn';
        return 'danger';
    }

    formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }

    daysUntil(dateStr: string): number {
        const today = new Date(); today.setHours(0,0,0,0);
        const due   = new Date(dateStr); due.setHours(0,0,0,0);
        return Math.round((due.getTime() - today.getTime()) / 86400000);
    }

    dueSeverity(isOverdue: boolean, daysUntil: number): SeverityType {
        if (isOverdue) return 'danger';
        if (daysUntil <= 1) return 'warn';
        return 'info';
    }

    dueLabel(isOverdue: boolean, daysUntil: number): string {
        if (isOverdue) return 'Overdue';
        if (daysUntil === 0) return 'Today';
        if (daysUntil === 1) return 'Tomorrow';
        return `${daysUntil}d`;
    }
}