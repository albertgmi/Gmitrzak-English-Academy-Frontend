import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ContentService, AssignmentStudentDto } from '../../services/student-services/content.service';

type View = 'active' | 'history';
type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
    selector: 'app-assignments',
    standalone: true,
    imports: [CommonModule, TableModule, TagModule, ToastModule, ButtonModule],
    providers: [MessageService],
    templateUrl: './assignments.component.html'
})
export class AssignmentsComponent implements OnInit {
    private contentService = inject(ContentService);
    private messageService = inject(MessageService);

    activeView = signal<View>('active');
    activeAssignments = this.contentService.assignments;
    history = signal<AssignmentStudentDto[]>([]);
    loadingHistory = signal(false);

    ngOnInit() {
        this.contentService.assignments.reload();
    }

    showHistory() {
        this.activeView.set('history');
        if (!this.history().length) {
            this.loadingHistory.set(true);
            
            this.contentService.getAssignmentHistory().subscribe({
                next: (data) => {
                    this.history.set(data);
                    this.loadingHistory.set(false);
                    this.messageService.add({ 
                        severity: 'success', 
                        summary: 'Data Loaded', 
                        detail: 'Assignment history has been loaded' 
                    });
                },
                error: (err) => {
                    this.loadingHistory.set(false);
                    this.messageService.add({ 
                        severity: 'error', 
                        summary: 'Error', 
                        detail: 'Failed to load assignment history' 
                    });
                }
            });
        }
    }

    dueSeverity(a: AssignmentStudentDto): TagSeverity {
        if (a.isCompleted) return 'success';
        if (a.isOverdue) return 'danger';
        const days = this.daysUntil(a.dueDate);
        if (days <= 1) return 'warn';
        return 'info';
    }

    dueLabel(a: AssignmentStudentDto): string {
        if (a.isCompleted) return 'Done';
        if (a.isOverdue) return 'Overdue';
        const days = this.daysUntil(a.dueDate);
        if (days === 0) return 'Today';
        if (days === 1) return 'Tomorrow';
        return `In ${days} days`;
    }

    daysUntil(dateStr: string): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dateStr);
        due.setHours(0, 0, 0, 0);
        return Math.round((due.getTime() - today.getTime()) / 86400000);
    }
}