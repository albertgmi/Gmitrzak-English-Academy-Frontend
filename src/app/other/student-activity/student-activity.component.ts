import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { InputTextModule } from 'primeng/inputtext';
import { StudentActivityService, StudentActivityDto } from '../../services/student-activity.service';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
    selector: 'app-student-activity',
    standalone: true,
    imports: [CommonModule, FormsModule, TagModule, SkeletonModule, InputTextModule, AvatarComponent],
    templateUrl: './student-activity.component.html'
})
export class StudentActivityComponent implements OnInit, OnDestroy {
    private activityService = inject(StudentActivityService);

    students = signal<StudentActivityDto[]>([]);
    loading = signal(true);
    searchTerm = signal('');

    private refreshInterval: any = null;

    onlineCount = computed(() => this.students().filter(s => s.isOnline).length);

    filteredStudents = computed(() => {
        const term = this.searchTerm().toLowerCase().trim();
        const list = this.students();

        const filtered = term
            ? list.filter(s => s.username.toLowerCase().includes(term))
            : list;

        return [...filtered].sort((a, b) => {
            if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
            const aTime = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
            const bTime = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
            return bTime - aTime;
        });
    });

    ngOnInit() {
        this.loadStudents();
        this.refreshInterval = setInterval(() => this.loadStudents(false), 30000);
    }

    ngOnDestroy() {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
    }

    loadStudents(showLoading = true) {
        if (showLoading) this.loading.set(true);

        this.activityService.getStudentsActivity().subscribe({
            next: (data) => {
                this.students.set(data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    lastActiveLabel(student: StudentActivityDto): string {
        if (student.isOnline) return 'Active now';
        if (!student.lastActiveAt) return 'Never';
        return this.timeAgo(student.lastActiveAt);
    }

    lastLoginLabel(student: StudentActivityDto): string {
        if (!student.lastLoginAt) return 'Never logged in';
        return this.timeAgo(student.lastLoginAt);
    }

    private timeAgo(dateStr: string): string {
        const diffMs = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diffMs / 60000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;

        const days = Math.floor(hours / 24);
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;

        return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
}