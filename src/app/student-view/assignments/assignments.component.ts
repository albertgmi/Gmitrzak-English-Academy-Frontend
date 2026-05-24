import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ContentService, AssignmentStudentDto } from '../../services/student-services/content.service';

type View = 'active' | 'history';
type SeverityType = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
    selector: 'app-assignments',
    standalone: true,
    imports: [CommonModule, TableModule, TagModule, ToastModule, ButtonModule],
    providers: [MessageService],
    templateUrl: './assignments.component.html'
})
export class AssignmentsComponent implements OnInit {
    private contentService  = inject(ContentService);
    private messageService  = inject(MessageService);
    private router          = inject(Router);

    activeView       = signal<View>('active');
    activeAssignments = this.contentService.assignments;
    history          = signal<AssignmentStudentDto[]>([]);
    loadingHistory   = signal(false);

    overdueAssignments = computed(() =>
        (this.activeAssignments.value() ?? []).filter(a => a.isOverdue)
    );

    pendingAssignments = computed(() =>
        (this.activeAssignments.value() ?? []).filter(a => !a.isOverdue)
    );

    ngOnInit() {
        this.contentService.assignments.reload();
    }

    showHistory() {
        this.activeView.set('history');
        if (!this.history().length) {
            this.loadingHistory.set(true);
            this.contentService.getAssignmentHistory().subscribe({
                next: (d) => { this.history.set(d); this.loadingHistory.set(false); },
                error: () => this.loadingHistory.set(false)
            });
        }
    }

    openModule(a: AssignmentStudentDto) {
        if (a.category === 'Sentences') {
            this.router.navigate(['/modules', a.moduleId, 'sentences']);
        }
    }

    dueSeverity(a: AssignmentStudentDto): SeverityType {
        if (a.isCompleted) return 'success';
        if (a.isOverdue)   return 'danger';
        const days = this.daysUntil(a.dueDate);
        if (days <= 1)     return 'warn';
        return 'info';
    }

    dueLabel(a: AssignmentStudentDto): string {
        if (a.isCompleted) return 'Done';
        if (a.isOverdue)   return 'Overdue';
        const days = this.daysUntil(a.dueDate);
        if (days === 0)    return 'Today';
        if (days === 1)    return 'Tomorrow';
        return `In ${days} days`;
    }

    historyStatusSeverity(a: AssignmentStudentDto): SeverityType {
        return a.isCompleted ? 'success' : 'danger';
    }

    historyStatusLabel(a: AssignmentStudentDto): string {
        return a.isCompleted ? 'Completed' : 'Overdue';
    }

    private daysUntil(dateStr: string): number {
        const today = new Date(); today.setHours(0,0,0,0);
        const due   = new Date(dateStr); due.setHours(0,0,0,0);
        return Math.round((due.getTime() - today.getTime()) / 86400000);
    }
}