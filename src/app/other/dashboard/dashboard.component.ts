import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthService } from '../../services/auth.service';
import { DashboardService, AdminDashboardDto, StudentDashboardDto } from '../../services/dashboard.service';
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
                next: (data) => { this.adminData.set(data); this.loading.set(false); },
                error: () => this.loading.set(false)
            });
        } else {
            this.dashboardService.getStudentDashboard().subscribe({
                next: (data) => {
                    if (data && data.upcomingModules) {
                        const todayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw' }).format(new Date());
                        const today = new Date(`${todayStr}T00:00:00`); 
                    
                        const dayOfWeek = today.getDay(); 
                        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

                        const currentMonday = new Date(today);
                        currentMonday.setDate(today.getDate() + daysToMonday);
                        currentMonday.setHours(0, 0, 0, 0);
                    
                        data.upcomingModules = data.upcomingModules
                            .filter(m => this.isThisWeek(m.unlockDate))
                            .map(m => {
                                const unlockDate = new Date(m.unlockDate);
                                return {
                                    ...m,
                                    isUnlocked: unlockDate >= currentMonday
                                };
                            });
                    }
                
                    this.studentData.set(data); 
                    this.loading.set(false); 
                },
                error: () => this.loading.set(false)
            });
        }
    }

    private isThisWeek(dateStr: string | Date): boolean {
        const targetDate = new Date(dateStr);

        const todayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw' }).format(new Date());
        const today = new Date(`${todayStr}T00:00:00`);

        const dayOfWeek = today.getDay(); 
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

        const monday = new Date(today);
        monday.setDate(today.getDate() + daysToMonday);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        return targetDate >= monday && targetDate <= sunday;
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

    daysUntil(date: string | Date): number {
        const todayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw' }).format(new Date());
        const today = new Date(`${todayStr}T00:00:00`);

        const targetStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw' }).format(new Date(date));
        const targetDate = new Date(`${targetStr}T00:00:00`);
        
        const diff = targetDate.getTime() - today.getTime();
        return Math.round(diff / (1000 * 60 * 60 * 24));
    }

    dueSeverity(a: { isCompleted?: boolean, dueDate: string | Date }): SeverityType {
        if (a.isCompleted) return 'success';
        const days = this.daysUntil(a.dueDate);
        if (days < 0) return 'danger';
        if (days <= 1) return 'warn';
        return 'info';
    }

    dueLabel(a: { isCompleted?: boolean, dueDate: string | Date }): string {
        if (a.isCompleted) return 'Done';
        const days = this.daysUntil(a.dueDate);
        if (days < 0) return 'Overdue';
        if (days === 0) return 'Today';
        if (days === 1) return 'Tomorrow';
        return `In ${days} days`;
    }
}